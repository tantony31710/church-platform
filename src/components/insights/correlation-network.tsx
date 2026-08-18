import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function CorrelationNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 250;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const links = [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }];

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'hsl(var(--border))');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', 'hsl(var(--primary))');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });
  }, []);

  return <svg ref={svgRef} width="100%" height="250" />;
}
