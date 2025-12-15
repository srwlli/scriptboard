/**
 * System Monitor v2 - Modular Components
 *
 * Enhanced system monitoring with process categorization,
 * expandable details, resource history, and quick filters.
 */

// Core components
export { Sparkline } from "./Sparkline";
export type { SparklineProps } from "./Sparkline";

export { QuickFilters } from "./QuickFilters";
export type { QuickFiltersProps, QuickFilter } from "./QuickFilters";

export { ProcessRow } from "./ProcessRow";
export type { ProcessRowProps } from "./ProcessRow";

export { ProcessDetails } from "./ProcessDetails";
export type { ProcessDetailsProps } from "./ProcessDetails";

export { ProcessGroup, CATEGORY_NAMES } from "./ProcessGroup";
export type { ProcessGroupProps } from "./ProcessGroup";

// Network monitoring
export { NetworkPanel } from "./NetworkPanel";
export type { NetworkPanelProps } from "./NetworkPanel";

// Disk usage
export { DiskUsagePanel } from "./DiskUsagePanel";
export type { DiskUsagePanelProps } from "./DiskUsagePanel";

// Main component
export { ProcessListV2 } from "./ProcessListV2";
export type { ProcessListV2Props } from "./ProcessListV2";
