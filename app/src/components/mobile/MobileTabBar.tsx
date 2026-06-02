import type { MobileTab } from './MobileApp';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'theme',    label: '테마',    icon: '📊' },
  { id: 'screener', label: '스크리너', icon: '🔍' },
  { id: 'watchlist',label: '관심종목', icon: '⭐' },
  { id: 'disclosure',label: '공시',   icon: '📋' },
];

export default function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav className="mobile-tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`mobile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="mobile-tab-icon">{tab.icon}</span>
          <span className="mobile-tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
