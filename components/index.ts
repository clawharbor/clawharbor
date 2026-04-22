// Component barrel exports
export * from './types';
export * from './utils';
export { NPC } from './NPC';
export { Room } from './Room';
export { MultiRoomGrid } from './MultiRoomGrid';
export type { MultiRoomGridProps } from './MultiRoomGrid';
export { AgentPanel } from './AgentPanel';
export { SettingsPanel } from './SettingsPanel';
export { CooldownTimer, linkifyFiles, Stat } from './CooldownTimer';
export { Celebration } from './Celebration';
export { AchievementToastContainer } from './AchievementToast';
export type { AchievementToastData } from './AchievementToast';
export { TemplateGallery } from './TemplateGallery';
export { DemoBanner } from './DemoBanner';
export { ShareModal } from './ShareModal';
export { ActivityHeatmap } from './ActivityHeatmap';
export { OfficeEvents } from './OfficeEvents';
export type { OfficeEvent } from './OfficeEvents';
export { CommandPalette } from './CommandPalette';
export type { CommandAction } from './CommandPalette';

// 🔥 Viral Features
export { BurnoutOverlay, BurnoutBadge, BurnoutPanel, useBurnout } from './BurnoutSystem';
export type { AgentBurnout, BurnoutLevel } from './BurnoutSystem';

export { OfficeReplayPlayer, useOfficeReplay } from './OfficeReplay';
export type { OfficeSnapshot } from './OfficeReplay';

export { BattleModal, BattleButton, useBattle } from './AgentBattle';
export type { Battle, BattleArgument, BattleRecord } from './AgentBattle';

// 💰 Agent Payroll
export { PayAgentButton, PayAgentModal, PAYROLL_TOKENS } from './AgentPayroll';
export type { PayrollToken, PaymentMethod, PayrollResult } from './AgentPayroll';

// 🐾 Office Pet — Bankr Bot mascot
export { OfficePet } from './OfficePet';
