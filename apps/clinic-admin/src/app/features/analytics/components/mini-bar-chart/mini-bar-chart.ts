import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartPoint } from '../../models/analytics-report.model';

interface Bar {
  label: string;
  value: number;
  x: number;
  width: number;
  height: number;
  y: number;
  showLabel: boolean;
}

const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 160;
const BAR_GAP = 2;
const MAX_VISIBLE_LABELS = 8;

/**
 * The Sprint 23 "Charts: Daily/Weekly/Monthly/Yearly" requirement, rendered
 * as a single-series SVG bar chart - no charting library is installed
 * anywhere in this app (see package.json), so this stays dependency-free.
 * One hue (Material 3's --mat-sys-primary) since a single series needs no
 * legend/categorical palette - see the dataviz skill's color-formula.md.
 * Each bar carries a native <title> for an accessible per-mark hover
 * tooltip; axis labels thin out past ~8 buckets to avoid collision.
 */
@Component({
  selector: 'app-mini-bar-chart',
  imports: [],
  templateUrl: './mini-bar-chart.html',
  styleUrl: './mini-bar-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniBarChart {
  readonly points = input<ChartPoint[]>([]);
  readonly valueSuffix = input('');

  protected readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

  protected readonly bars = computed<Bar[]>(() => {
    const points = this.points();
    if (points.length === 0) {
      return [];
    }
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const barAreaHeight = VIEWBOX_HEIGHT - 24;
    const width = VIEWBOX_WIDTH / points.length - BAR_GAP;
    const labelSkip = Math.max(1, Math.ceil(points.length / MAX_VISIBLE_LABELS));

    return points.map((point, index) => {
      const height = Math.max(2, (point.value / maxValue) * barAreaHeight);
      return {
        label: point.label,
        value: point.value,
        x: index * (width + BAR_GAP),
        width,
        height,
        y: barAreaHeight - height,
        showLabel: index % labelSkip === 0,
      };
    });
  });
}
