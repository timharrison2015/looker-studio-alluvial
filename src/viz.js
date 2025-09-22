import * as dscc from 'https://unpkg.com/@looker/dscc';
.data(links)
.join('path')
.attr('class', 'link')
.attr('d', sankeyLinkHorizontal())
.attr('stroke', d => colorMode === 'step' ? color(d.source.step) : '#888')
.attr('stroke-width', d => Math.max(1, d.width))
.on('mousemove', (event, d) => {
const pct = total ? ((d.value / total) * 100).toFixed(2) : '0.00';
tooltip.style.display = 'block';
tooltip.style.left = event.pageX + 12 + 'px';
tooltip.style.top = event.pageY + 12 + 'px';
tooltip.innerHTML = `${d.source.name} → ${d.target.name}<br><b>${fmt.format(d.value)}</b> (${pct}%)`;
})
.on('mouseout', () => tooltip.style.display = 'none');


// Nodes
const node = svg.append('g')
.selectAll('g')
.data(nodes)
.join('g')
.attr('class', 'node');


node.append('rect')
.attr('x', d => d.x0)
.attr('y', d => d.y0)
.attr('height', d => Math.max(1, d.y1 - d.y0))
.attr('width', d => d.x1 - d.x0)
.attr('fill', d => colorMode === 'step' ? color(d.step) : '#4a90e2')
.append('title')
.text(d => `${d.name}\n${fmt.format(d.value)} (${total ? ((d.value/total)*100).toFixed(2) : '0.00'}%)`);


node.append('text')
.attr('x', d => d.x0 - 6)
.attr('y', d => (d.y1 + d.y0) / 2)
.attr('dy', '0.35em')
.attr('text-anchor', 'end')
.text(d => d.name)
.filter(d => d.x0 < width / 2)
.attr('x', d => d.x1 + 6)
.attr('text-anchor', 'start');
}


// ---- DSCC adapter ----
// Transform Looker Studio payload → { rows, dimensions, metric, style }
function transformMessage(msg) {
const fields = msg.fields;
const dimIds = fields.DIMENSION.map(f => f.id);
const metricId = fields.METRIC[0].id;


const rows = msg.tables.DEFAULT.map(r => {
const out = {};
// Dimensions preserve order
dimIds.forEach((id, i) => {
out[id] = { value: r[id]?.value };
});
out[metricId] = { value: r[metricId]?.value };
return out;
});


const style = {
colorMode: msg.style?.colorMode?.value || 'step',
minFlow: Number(msg.style?.minFlow?.value ?? 0),
nodePadding: Number(msg.style?.nodePadding?.value ?? 12)
};


return { rows, dimensions: dimIds, metric: metricId, style };
}


function draw(msg) {
const data = transformMessage(msg);
render(data);
}


// Subscribe to data changes
// If you're testing locally outside of LS, you can shim dscc
if (dscc?.subscribeToData) {
dscc.subscribeToData(draw, { transform: dscc.tableTransform });
} else {
console.warn('dscc not found; running in standalone mode');
}
