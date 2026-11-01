import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BookOpen,
  CalendarDays,
  Check,
  CircleHelp,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PiggyBank,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import AuthPanel from './AuthPanel';
import { apiRequest, AuthStatus, MemberAccount, MemberTransaction } from './api';

type AssistantMessage = {
  from: 'assistant' | 'member';
  text: string;
};

const heroImage =
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1500&q=85';
const communityImage =
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85';
const familyImage =
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85';

const assistantReply = (question: string) => {
  const normalized = question.toLowerCase();
  if (normalized.includes('balance') || normalized.includes('account')) {
    return 'You can see accounts linked to your demo login in the member dashboard. The project does not connect to a real credit union or real money.';
  }
  if (normalized.includes('routing') || normalized.includes('direct deposit')) {
    return 'For this demo, please use the secure contact options on the real credit union website to confirm routing details. I can’t provide or verify account numbers here.';
  }
  if (normalized.includes('save') || normalized.includes('savings') || normalized.includes('summer')) {
    return 'Our sample Summer Savings account can help you set a goal and build toward it at your own pace. Current rates and eligibility would need to be confirmed with a team member.';
  }
  if (normalized.includes('loan') || normalized.includes('borrow')) {
    return 'We offer educator-focused borrowing options in this concept. Visit the Borrow section to compare sample options, then connect with a team member for current terms.';
  }
  if (normalized.includes('hour') || normalized.includes('contact') || normalized.includes('person')) {
    return 'Our friendly team is here to help. Call (800) 555-0142, Monday–Friday, 8:00 am–5:00 pm. This is fictional contact information for the prototype.';
  }
  return 'I can help with checking and savings, educator borrowing, membership, or getting in touch with our team. What would you like to explore?';
};

function Brand() {
  return (
    <a href="#home" className="brand" aria-label="Teachers First home">
      <span className="brand-mark"><HeartHandshake size={18} strokeWidth={2.5} /></span>
      <span className="brand-words">
        <strong>Teachers First</strong>
        <small>CREDIT UNION</small>
      </span>
    </a>
  );
}

function App() {
  // These values are UI state. The signed-in identity itself stays in the
  // browser's HttpOnly cookie and is checked with the API on page load.
  const [isMemberView, setIsMemberView] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [member, setMember] = useState<AuthStatus | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authError, setAuthError] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { from: 'assistant', text: 'Hi there! I’m the Teachers First assistant. What can I help you find today?' },
    { from: 'member', text: 'I want to know more about saving for summer.' },
    { from: 'assistant', text: 'A little planning can make a big difference. Our Summer Savings account helps you set a goal and build toward it at your own pace.' },
  ]);

  // When the page reloads, ask the API whether its HttpOnly cookie still
  // represents a signed-in member. The cookie itself stays out of JavaScript.
  useEffect(() => {
    apiRequest<AuthStatus>('/api/auth/me')
      .then((status) => {
        if (status.isAuthenticated) {
          setMember(status);
        }
      })
      .catch((requestError: unknown) => {
        setAuthError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not check the sign-in session.',
        );
      });
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthError('');
    setAuthMode(mode);
    setMobileMenuOpen(false);
  };

  const onAuthenticated = (status: AuthStatus) => {
    setMember(status);
    setAuthError('');
    setAuthMode(null);
    setIsMemberView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const signOut = async () => {
    try {
      await apiRequest<AuthStatus>('/api/auth/logout', { method: 'POST' });
      setMember(null);
      setIsMemberView(false);
      setAuthError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setAuthError(
        requestError instanceof Error
          ? requestError.message
          : 'Sign out could not be completed. Please try again.',
      );
    }
  };

  const showDashboard = () => {
    if (member?.isAuthenticated) {
      setIsMemberView(true);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      openAuth('login');
    }
  };

  const showExploreDestination = () => {
    if (member?.isAuthenticated) {
      showDashboard();
    } else {
      openAuth('login');
    }
  };

  // Forms use React state; the API receives JSON rather than a full-page post.
  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    setMessages((current) => [...current, { from: 'member', text: question }]);
    setChatInput('');
    setChatError('');
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (!apiBase) {
      setMessages((current) => [...current, { from: 'assistant', text: assistantReply(question) }]);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });
      if (!response.ok) throw new Error(`Assistant request failed (${response.status})`);
      const result: { reply: string } = await response.json();
      setMessages((current) => [...current, { from: 'assistant', text: result.reply }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'The assistant service could not be reached.');
    }
  };

  return (
    <div id="home" className="min-h-screen bg-white text-ink">
      <div className="utility-bar">
        <div className="page-shell utility-inner">
          <span>For those who teach, care, and help us grow.</span>
          <span className="utility-links">
            <a href="#contact">Locations &amp; ATMs</a><a href="#contact">Contact us</a><a href="#help">Help &amp; support</a>
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="page-shell header-inner">
          <Brand />
          <button className="mobile-menu-button" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`main-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
            <a href="#bank" onClick={() => setMobileMenuOpen(false)}>Bank</a>
            <a href="#borrow" onClick={() => setMobileMenuOpen(false)}>Borrow</a>
            <a href="#membership" onClick={() => setMobileMenuOpen(false)}>Membership</a>
            <a href="#community" onClick={() => setMobileMenuOpen(false)}>Our community</a>
            <div className="mobile-nav-actions">
              {!member?.isAuthenticated && (
                <button className="button button-outline" onClick={() => openAuth('register')}>Join us</button>
              )}
              <button className="button button-primary" onClick={showDashboard}>
                {member?.isAuthenticated ? 'Member dashboard' : 'Sign in'} <ArrowRight size={14} />
              </button>
            </div>
          </nav>
          <div className="header-actions">
            {!member?.isAuthenticated && (
              <button className="button button-outline" onClick={() => openAuth('register')}>Join us</button>
            )}
            <button className="button button-primary" onClick={showDashboard}>
              {member?.isAuthenticated ? 'Member dashboard' : 'Sign in'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {isMemberView && member?.isAuthenticated ? (
        <MemberDashboard email={member.email ?? ''} onSignOut={signOut} />
      ) : (
        <HomePage onExplore={showExploreDestination} onJoin={() => openAuth('register')} />
      )}

      {authMode && (
        <AuthPanel
          key={authMode}
          initialError={authError}
          initialMode={authMode}
          onAuthenticated={onAuthenticated}
          onClose={() => setAuthMode(null)}
        />
      )}

      <AssistantWidget
        open={assistantOpen}
        messages={messages}
        input={chatInput}
        error={chatError}
        onToggle={() => setAssistantOpen((open) => !open)}
        onInputChange={setChatInput}
        onSubmit={sendMessage}
      />
    </div>
  );
}

// Smaller components receive values and click handlers as props from their parent.
function HomePage({ onExplore, onJoin }: { onExplore: () => void; onJoin: () => void }) {
  return (
    <main>
      <section className="hero-section page-shell">
        <div className="hero-copy">
          <span className="eyebrow">A credit union made for you</span>
          <h1>A little more care.<br />A lot more possibility.</h1>
          <p>Thoughtful banking for educators, school employees, and the families who help our communities thrive.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#bank">Find your next step <ArrowRight size={15} /></a>
            <a className="text-link" href="#membership">Explore accounts <ArrowRight size={14} /></a>
          </div>
          <div className="hero-note"><BadgeCheck size={16} /> A not-for-profit financial partner, built around people.</div>
        </div>
        <div className="hero-visual">
          <img src={heroImage} alt="Teacher helping a student learn in a bright classroom" />
          <div className="photo-caption"><GraduationCap size={18} /><span>Here for every lesson, big and small.</span></div>
          <button className="photo-play" aria-label="Explore Teachers First stories"><ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="quick-start page-shell" id="bank" aria-label="Start with a product">
        <div className="section-heading compact-heading">
          <span className="eyebrow">Find your first step</span>
          <h2>Good banking. For every chapter.</h2>
        </div>
        <div className="product-grid">
          <ProductCard icon={<Wallet />} tag="Everyday banking" title="Spend with confidence" copy="Simple checking, with smart tools and no monthly maintenance fee." href="#accounts" />
          <ProductCard icon={<PiggyBank />} tag="Build your future" title="Save your way" copy="Flexible savings that help you reach the moments that matter." href="#rates" />
          <ProductCard icon={<HeartHandshake />} tag="Made for educators" title="Make your next move" copy="Explore borrowing designed with your life and work in mind." href="#borrow" />
          <ProductCard icon={<BookOpen />} tag="Plan with purpose" title="Grow your classroom" copy="Resources and support for your school and community." href="#community" />
        </div>
      </section>

      <section className="rate-band" id="rates">
        <div className="page-shell rate-inner">
          <div className="rate-intro"><span className="eyebrow">A little inspiration. A bigger possibility.</span><h2>Make more possible.</h2><p>Sample rates to help you imagine what’s next.</p></div>
          <RateItem label="Auto loans" rate="5.49%" suffix="APR" />
          <RateItem label="12-month certificate" rate="4.00%" suffix="APY" />
          <RateItem label="Home equity" rate="6.75%" suffix="APR" />
        </div>
        <div className="page-shell rate-disclaimer">Rates shown are examples for this design concept, not current offers. Actual rates depend on eligibility and loan terms.</div>
      </section>

      <section className="story-section page-shell" id="membership">
        <div className="story-image"><img src={familyImage} alt="Family spending a sunny afternoon together outdoors" /></div>
        <div className="story-copy">
          <span className="eyebrow">A place to belong</span>
          <h2>You take care of so many. Let us take care of you.</h2>
          <p>Membership means having a financial partner who understands the people and purpose behind your work.</p>
          <ul className="check-list">
            <li><Check size={15} /> Benefits for educators and their families</li>
            <li><Check size={15} /> Friendly, human support when you need it</li>
            <li><Check size={15} /> A community-first approach to every decision</li>
          </ul>
          <a className="text-link" href="#contact">See who can join <ArrowRight size={14} /></a>
        </div>
      </section>

      <section className="money-section" id="accounts">
        <div className="page-shell money-inner">
          <div className="money-copy">
            <span className="eyebrow eyebrow-light">Less juggling, more living</span>
            <h2>Your money, on your time.</h2>
            <p>See the little things, move toward a goal, and keep your day in your control. Wherever the school day takes you.</p>
            <div className="money-checks"><span><Check size={14} /> Easy transfers</span><span><Check size={14} /> Card controls</span><span><Check size={14} /> Mobile banking</span></div>
            <button className="button button-white" onClick={onExplore}>Explore digital banking <ArrowRight size={14} /></button>
          </div>
          <div className="balance-card">
            <div className="balance-card-head"><span>Good morning, Alex.</span><MoreHorizontal size={18} /></div>
            <small>Everyday Checking · •• 1042</small>
            <strong>$4,286.52</strong>
            <div className="balance-actions"><button onClick={onExplore}>Move money</button><button onClick={onExplore}>Manage card</button></div>
            <div className="balance-footer"><span>Maple Market</span><b>− $64.28</b></div>
          </div>
        </div>
      </section>

      <section className="community-section page-shell" id="community">
        <div className="community-copy">
          <span className="eyebrow">Rooted in our schools. Built to grow.</span>
          <h2>Stronger classrooms.<br />Stronger communities.</h2>
          <p>The people who shape tomorrow deserve support today. Explore classroom visits, local partnerships, and financial learning made for educators.</p>
          <a href="#resources" className="text-link">Meet your community <ArrowRight size={14} /></a>
        </div>
        <img src={communityImage} alt="Community volunteers working together around a table" />
      </section>

      <section className="resources-section" id="resources">
        <div className="page-shell">
          <div className="resources-heading"><div><span className="eyebrow">Small steps. Lasting confidence.</span><h2>A little know-how goes a long way.</h2></div><a href="#help" className="text-link">Visit the resource center <ArrowRight size={14} /></a></div>
          <div className="resource-grid">
            <ResourceCard icon={<Sun />} type="SAVING FOR SOMETHING" title="A summer budget that works all year" read="5 min read" />
            <ResourceCard icon={<PiggyBank />} type="GETTING STARTED" title="Small savers. Big possibilities." read="4 min read" />
            <ResourceCard icon={<ShieldCheck />} type="STAYING SAFE" title="Spot a message that isn’t from us" read="3 min read" />
          </div>
        </div>
      </section>

      <section className="contact-strip page-shell" id="contact">
        <div><span className="eyebrow">Real people. In your corner.</span><h2>A question about your next step? We’ll help you find a clear answer.</h2></div>
        <div className="contact-phone"><span>CALL (800) 555-0142</span><small>Monday–Friday, 8:00 am–5:00 pm</small></div>
        <a className="button button-outline" href="mailto:hello@teachersfirst.example">Talk to our team</a>
      </section>
      <section className="join-banner">
        <div className="page-shell join-inner"><div><span className="eyebrow">You’re not doing this alone</span><h2>Let’s build something good, together.</h2></div><button onClick={onJoin} className="button button-primary">Create a demo login <ArrowRight size={14} /></button></div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ProductCard({ icon, tag, title, copy, href }: { icon: React.ReactNode; tag: string; title: string; copy: string; href: string }) {
  return (
    <a className="product-card" href={href}>
      <span className="line-icon">{icon}</span><span className="eyebrow">{tag}</span>
      <h3>{title}</h3><p>{copy}</p><span className="card-link">Explore <ArrowRight size={14} /></span>
    </a>
  );
}

function RateItem({ label, rate, suffix }: { label: string; rate: string; suffix: string }) {
  return <div className="rate-item"><span>{label}</span><strong>{rate}<small> {suffix}</small></strong><a href="#borrow">View details <ArrowRight size={12} /></a></div>;
}

function ResourceCard({ icon, type, title, read }: { icon: React.ReactNode; type: string; title: string; read: string }) {
  return <a href="#help" className="resource-card"><span className="resource-icon">{icon}</span><small>{type}</small><h3>{title}</h3><span className="read-time">{read} <ArrowRight size={13} /></span></a>;
}

function MemberDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [accounts, setAccounts] = useState<MemberAccount[]>([]);
  const [transactions, setTransactions] = useState<MemberTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Load only the accounts the API associates with this signed-in member.
  // The cleanup flag prevents a slow request updating state after sign-out.
  useEffect(() => {
    let isCurrent = true;

    async function loadMemberData() {
      try {
        const memberAccounts = await apiRequest<MemberAccount[]>('/api/accounts');
        if (!isCurrent) return;
        setAccounts(memberAccounts);

        if (memberAccounts.length > 0) {
          const recentTransactions = await apiRequest<MemberTransaction[]>(
            `/api/accounts/${memberAccounts[0].id}/transactions`,
          );
          if (isCurrent) setTransactions(recentTransactions);
        }
      } catch (requestError) {
        if (isCurrent) {
          setDataError(
            requestError instanceof Error
              ? requestError.message
              : 'Account information could not be loaded.',
          );
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void loadMemberData();
    return () => {
      isCurrent = false;
    };
  }, []);

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const initials = email.slice(0, 2).toUpperCase() || 'TF';

  return (
    <main className="member-layout">
      <aside className="member-sidebar">
        <Brand />
        <div className="member-sidebar-label">MEMBER BANKING</div>
        {['Overview', 'Accounts', 'Move money', 'Pay bills', 'Cards', 'Statements', 'Help & support'].map((item, index) => {
          const icons = [Landmark, Wallet, ArrowUpRight, CalendarDays, CreditCard, BookOpen, CircleHelp];
          const Icon = icons[index];
          return <button key={item} onClick={() => setActiveTab(item)} className={`sidebar-link ${activeTab === item ? 'sidebar-active' : ''}`}><Icon size={16} />{item}</button>;
        })}
        <div className="sidebar-help"><HeartHandshake size={17} /><b>Your people. Your credit union.</b><p>We’re here to help with the next step.</p><a href="#contact">Get support <ArrowRight size={12} /></a></div>
      </aside>
      <div className="member-content">
        <div className="member-topbar"><span>MEMBER BANKING</span><div><button aria-label="Search"><CircleHelp size={17} /></button><button aria-label="Notifications"><Sparkles size={17} /></button><span className="avatar">{initials}</span><b>{email}</b><button onClick={onSignOut}>Sign out</button></div></div>
        <div className="dashboard-main">
          <div className="dashboard-title-row"><div><h1>Good morning.</h1><p>Your member dashboard and account information.</p></div><button className="button button-primary" onClick={() => setActiveTab('Move money')}>Move money <ArrowRight size={14} /></button></div>
          <div className="demo-alert"><ShieldCheck size={17} /><span><b>Learning-project account.</b> Only data linked to your login is shown; all balances are fictional.</span><span className="sr-only">Sample data only</span></div>
          {dataError && <div className="dashboard-error" role="alert">{dataError}</div>}
          <div className="account-heading"><h2>Your accounts</h2><span>{accounts.length} found</span></div>
          {loading ? (
            <p className="dashboard-empty" role="status">Loading your accounts…</p>
          ) : accounts.length === 0 ? (
            <p className="dashboard-empty">No accounts are linked to this demo login yet. Register the example email and follow the sample-data step in the README to explore the dashboard.</p>
          ) : (
            <div className="dashboard-accounts">
              {accounts.map((account, index) => {
                const Icon = account.accountType.toLowerCase().includes('sav') ? PiggyBank : Wallet;
                return (
                  <button className={`account-card ${index === 0 ? 'account-card-primary' : ''}`} key={account.id} onClick={() => setActiveTab('Accounts')}>
                    <span className="account-card-top"><Icon size={18} /><small>{account.maskedNumber}</small></span>
                    <b>{account.name}</b>
                    <strong>{currency.format(account.balance)}</strong>
                    <small>{account.accountType}{account.annualPercentageYield ? ` · ${account.annualPercentageYield.toFixed(2)}% APY` : ''}</small>
                  </button>
                );
              })}
            </div>
          )}
          <div className="dashboard-shortcuts">
            <button onClick={() => setActiveTab('Move money')}><ArrowUpRight size={16} /> Transfer money</button>
            <button onClick={() => setActiveTab('Pay bills')}><Banknote size={16} /> Pay a bill</button>
            <button onClick={() => setActiveTab('Accounts')}><ArrowDownLeft size={16} /> Deposit a check</button>
            <button onClick={() => setActiveTab('Cards')}><CreditCard size={16} /> Manage cards</button>
          </div>
          <div className="dashboard-columns">
            <section className="activity-card">
              <div className="activity-head"><h2>Recent activity</h2><a href="#activity">View all <ArrowRight size={13} /></a></div>
              {transactions.map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <span className="transaction-date">{new Date(transaction.postedAtUtc).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                  <span className="transaction-icon"><Banknote size={15} /></span>
                  <span className="transaction-merchant"><b>{transaction.description}</b><small>{transaction.category}</small></span>
                  <strong className={transaction.amount > 0 ? 'positive-amount' : ''}>{transaction.amount > 0 ? '+' : ''}{currency.format(transaction.amount)}</strong>
                </div>
              ))}
              {!loading && transactions.length === 0 && <p className="activity-empty">No transactions are available for this account yet.</p>}
              <a className="statement-link" href="#statements">See all activity <ArrowRight size={13} /></a>
            </section>
            <aside className="dashboard-aside">
              <div className="goal-card"><span><Sun size={16} /> GOAL PREVIEW</span><b>Summer, with a plan.</b><small>Goal tracking is a design sample, not connected to transfers.</small><div className="progress-track"><i /></div><a href="#goals">Explore savings <ArrowRight size={12} /></a></div>
              <div className="debit-card"><span>DEMO CARD</span><CreditCard size={17} /><strong>Card controls preview</strong><small>No payment card is connected.</small></div>
            </aside>
          </div>
          <p className="dashboard-disclaimer">Practice project only · No real money, accounts, transfers, or membership. <a href="#privacy">Privacy &amp; security</a> · <a href="#accessibility">Accessibility</a></p>
        </div>
      </div>
    </main>
  );
}

function AssistantWidget({
  open,
  messages,
  input,
  error,
  onToggle,
  onInputChange,
  onSubmit,
}: {
  open: boolean;
  messages: AssistantMessage[];
  input: string;
  error: string;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      {/* Conditional rendering keeps the chat panel out of the page until opened. */}
      {open && (
        <section className="assistant-panel" aria-label="Teachers First assistant">
          <div className="assistant-header"><div className="assistant-avatar"><Sparkles size={17} /></div><div><b>Teachers First assistant</b><small>Here to help you find your next step</small></div><button onClick={onToggle} aria-label="Close assistant"><X size={17} /></button></div>
          <div className="assistant-disclaimer">Demo assistant · Please don’t share account or personal information.</div>
          <div className="assistant-messages">
            {messages.map((message, index) => <div className={`chat-bubble ${message.from === 'member' ? 'chat-member' : 'chat-assistant'}`} key={`${message.from}-${index}`}>{message.text}</div>)}
            <div className="assistant-prompt"><Sparkles size={14} /> Need account help? Please connect with a team member.</div>
            {error && <div className="assistant-error" role="status">{error} Please try again or use Contact us.</div>}
          </div>
          <form className="assistant-form" onSubmit={onSubmit}><input value={input} onChange={(event) => onInputChange(event.target.value)} placeholder="Type your question..." aria-label="Type your question" /><button type="submit" aria-label="Send message"><Send size={16} /></button></form>
        </section>
      )}
      <button className={`assistant-launcher ${open ? 'launcher-open' : ''}`} onClick={onToggle} aria-expanded={open}>
        {open ? <X size={17} /> : <MessageCircle size={17} />}<span>{open ? 'Close assistant' : 'Ask Teachers First'}</span>
      </button>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer" id="help">
      <div className="page-shell">
        <div className="footer-main">
          <div className="footer-brand"><Brand /><p>For those who teach. For those who love.<br />Member-owned. Community-minded. Always in your corner.</p><div className="footer-social"><a href="#social">in</a><a href="#social">f</a><a href="#social">◎</a></div></div>
          <div className="footer-column"><b>Explore</b><a href="#bank">Checking &amp; savings</a><a href="#borrow">Loans &amp; credit</a><a href="#membership">Become a member</a></div>
          <div className="footer-column"><b>Member help</b><a href="#help">Help center</a><a href="#contact">Locations &amp; ATMs</a><a href="#contact">Lost or stolen card</a></div>
          <div className="footer-column"><b>Important information</b><a href="#privacy">Privacy &amp; security</a><a href="#accessibility">Accessibility</a><a href="#terms">Terms &amp; disclosures</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Teachers First Credit Union · Design concept for a fictional credit union.</span><span>Products, programs, rates, and member information shown are examples only.</span></div>
      </div>
    </footer>
  );
}

export default App;
