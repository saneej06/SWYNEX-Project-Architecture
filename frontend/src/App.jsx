import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Compass, Filter, HeartHandshake, Info,
  LayoutDashboard, LoaderCircle, Lock, LogIn, LogOut, MapPin, Menu,
  PackageSearch, Plus, Search, ShieldCheck, ShoppingBasket, Sparkles,
  Store, TrendingDown, UserCircle, Wallet, X
} from 'lucide-react';
import { api } from './api.js';
import { DEMO_PRODUCTS, DEMO_SHOPS, demoCompare } from './demoData.js';

const categories = ['All products', 'Rice & Grains', 'Essentials', 'Cooking', 'Baking', 'Dairy', 'Beverages'];
const price = value => `Rs. ${Number(value).toLocaleString('en-LK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
const dateLabel = value => value ? new Date(value).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) : '—';
const symbolFor = name => ({'White Rice':'🍚','Red Rice':'🌾','White Sugar':'🧂','Dhal':'🫘','Coconut Oil':'🥥','Wheat Flour':'🌿','Milk Powder':'🥛','Tea Powder':'🍵'})[name] || '🛒';

function Pill({ children, kind = 'subtle' }) { return <span className={`pill pill-${kind}`}>{children}</span>; }
function Empty({ icon: Icon = PackageSearch, title, note }) { return <div className="empty"><Icon size={32}/><h3>{title}</h3><p>{note}</p></div>; }

export default function App() {
  const [page, setPage] = useState('discover');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [shops, setShops] = useState(DEMO_SHOPS);
  const [districts, setDistricts] = useState(['Anuradhapura','Batticaloa','Polonnaruwa']);
  const [stats, setStats] = useState({product_count:8,shop_count:4,approved_report_count:32,district_count:3});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [district, setDistrict] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [comparison, setComparison] = useState(demoCompare(1));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [reviewBusy, setReviewBusy] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportForm, setReportForm] = useState({product_id: '1', shop_id: '1', price_lkr: '', observed_at: new Date().toISOString().slice(0,10)});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [, p, s, d, count] = await Promise.all([
          api('/health'), api('/products'), api('/shops'), api('/districts'), api('/stats')
        ]);
        if (!cancelled) {
          setBackendOnline(true);
          setProducts(p.items);
          setShops(s.items);
          setDistricts(d.items);
          setStats(count);
        }
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
      if (sessionStorage.getItem('pricepulse_token')) {
        try {
          const me = await api('/auth/me');
          if (!cancelled) setSession(me.user);
        } catch {
          sessionStorage.removeItem('pricepulse_token');
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCompare() {
      if (!backendOnline) {setComparison(demoCompare(selectedProductId, district)); return;}
      setLoading(true);
      try {
        const data = await api(`/prices/compare?productId=${selectedProductId}&district=${encodeURIComponent(district)}`);
        if (!cancelled) setComparison(data);
      } catch (error) {
        if (!cancelled) { setComparison({items:[]}); setNotice(error.message); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCompare();
    return () => { cancelled = true; };
  }, [selectedProductId, district, backendOnline]);

  const visibleProducts = useMemo(() => products.filter(p =>
    (category === 'All products' || p.category === category) &&
    `${p.name} ${p.brand || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [products, category, query]);
  const selectedProduct = products.find(p => Number(p.id) === Number(selectedProductId)) || products[0];
  const cheapest = comparison?.items?.[0];
  const dearest = comparison?.items?.[comparison?.items?.length - 1];
  const spread = cheapest && dearest ? Number(dearest.price_lkr) - Number(cheapest.price_lkr) : 0;

  function navigate(next) {
    setPage(next); setMobileMenu(false); setNotice('');
    if (next === 'my-reports') refreshMine();
    if (next === 'admin') refreshAdmin();
    window.scrollTo({top:0, behavior:'smooth'});
  }
  async function refreshMine() {
    if (!session || !backendOnline) return;
    try { const data = await api('/my/price-reports'); setMyReports(data.items); }
    catch (error) { setNotice(error.message); }
  }
  async function refreshAdmin() {
    if (session?.role !== 'ADMIN' || !backendOnline) return;
    try { const data = await api('/admin/price-reports'); setAdminReports(data.items); }
    catch (error) { setNotice(error.message); }
  }
  async function authenticate(event) {
    event.preventDefault(); setAuthBusy(true); setNotice('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(`/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method:'POST', body:JSON.stringify(data)
      });
      sessionStorage.setItem('pricepulse_token', result.token);
      setSession(result.user); setAuthOpen(false); setNotice(`Welcome${result.user.name ? `, ${result.user.name}` : ''}!`);
    } catch (error) { setNotice(error.message); }
    finally {setAuthBusy(false);}
  }
  async function submitReport(event) {
    event.preventDefault();
    if (!session) {setAuthOpen(true); return;}
    if (!backendOnline) {setNotice('Demo preview: start PostgreSQL and the backend first to submit reports.'); return;}
    setReportBusy(true); setNotice('');
    try {
      await api('/price-reports', {method:'POST', body:JSON.stringify(reportForm)});
      setNotice('Price submitted! An admin needs to approve it before it becomes public.');
      setReportForm(form => ({...form, price_lkr:''}));
      navigate('my-reports');
      setNotice('Price submitted for admin review.');
    } catch (error) {setNotice(error.message);}
    finally {setReportBusy(false);}
  }
  async function moderate(id, status) {
    setReviewBusy(id); setNotice('');
    try {
      await api(`/admin/price-reports/${id}`, {method:'PATCH', body:JSON.stringify({status})});
      setNotice(`Report #${id} ${status.toLowerCase()}.`);
      await refreshAdmin();
    } catch (error) {setNotice(error.message);}
    finally {setReviewBusy(null);}
  }
  function signout() { sessionStorage.removeItem('pricepulse_token'); setSession(null); setMyReports([]); setAdminReports([]); navigate('discover'); }
  function openProduct(product) {setSelectedProductId(Number(product.id)); navigate('compare');}

  const navLinks = [{id:'discover', label:'Discover'}, {id:'compare', label:'Compare prices'}, {id:'submit', label:'Submit a price'}];

  return <div className="site-shell">
    <div className="announcement"><Sparkles size={13}/> SWYNEX Task 01 • Student-built full-stack architecture starter <Sparkles size={13}/></div>
    <header className="site-header">
      <div className="container nav-wrap">
        <button className="brand" onClick={() => navigate('discover')} aria-label="Go to home">
          <span className="brand-icon"><ShoppingBasket size={21}/></span>
          <span>Price<span className="brand-accent">Pulse</span><small>LOCAL PRICE INTELLIGENCE</small></span>
        </button>
        <nav className={`main-nav ${mobileMenu ? 'open' : ''}`} aria-label="Main navigation">
          {navLinks.map(link => <button key={link.id} className={page === link.id ? 'active' : ''} onClick={() => navigate(link.id)}>{link.label}</button>)}
          {session && <button className={page === 'my-reports' ? 'active' : ''} onClick={() => navigate('my-reports')}>My reports</button>}
          {session?.role === 'ADMIN' && <button className={page === 'admin' ? 'active' : ''} onClick={() => navigate('admin')}>Admin</button>}
        </nav>
        <div className="nav-actions">
          {session ? <div className="user-controls"><span className="user-name"><UserCircle size={16}/>{session.name.split(' ')[0]}</span><button className="icon-button" onClick={signout} title="Sign out"><LogOut size={18}/></button></div>
            : <button className="btn btn-dark btn-small" onClick={() => {setAuthMode('login'); setAuthOpen(true); setNotice('');}}><LogIn size={16}/> Sign in</button>}
          <button className="hamburger icon-button" onClick={() => setMobileMenu(v => !v)} aria-label="Toggle menu">{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
      </div>
    </header>

    <main>
      {notice && <div className="container notice" role="status"><Info size={17}/><span>{notice}</span><button aria-label="Close message" onClick={() => setNotice('')}><X size={16}/></button></div>}
      {!backendOnline && <div className="container"><div className="demo-banner"><Info size={16}/><span><strong>Preview mode:</strong> These are fictional sample prices. Start the backend + PostgreSQL for live submission and approval features.</span></div></div>}
      {backendOnline && <div className="container"><div className="demo-banner"><Info size={16}/><span><strong>Academic prototype:</strong> Initial seed prices are fictional demo values, not verified shop offers. Always check the observation date.</span></div></div>}

      {page === 'discover' && <>
        <section className="container hero">
          <div className="hero-main">
            <Pill kind="mint"><span className="dot"/> Made for smarter local shopping</Pill>
            <h1>Good prices.<br/><span>Better choices.</span></h1>
            <p>See community-reported grocery prices from local shops, compare the same products, and spend with more confidence.</p>
            <div className="hero-buttons"><button className="btn btn-primary" onClick={() => navigate('compare')}>Compare prices <ArrowRight size={18}/></button><button className="btn btn-outline" onClick={() => navigate('submit')}>Share a price <Plus size={18}/></button></div>
            <div className="hero-trust"><span><CheckCircle2 size={17}/> Community-driven</span><span><ShieldCheck size={17}/> Reviewed submissions</span><span><MapPin size={17}/> Sri Lanka-focused</span></div>
          </div>
          <div className="hero-visual" aria-label="Illustrative price comparison">
            <div className="floating-bubble bubble-top"><TrendingDown size={18}/> Compare, don't guess</div>
            <div className="hero-card"><div className="hero-card-header"><div><span className="micro">PRICE SNAPSHOT</span><h3>Today's grocery picks</h3></div><span className="hero-basket">🛍️</span></div>
              {products.slice(0, 3).map((product, i) => {
                const demo = demoCompare(product.id);
                return <div className="hero-item" key={product.id}><span className="hero-item-emoji">{symbolFor(product.name)}</span><span className="hero-item-name">{product.name}<small>{product.quantity} {product.unit}</small></span><span className="hero-item-price">{demo.items.length ? price(demo.items[0].price_lkr) : '—'}<small>demo lowest</small></span></div>;
              })}
              <div className="hero-card-footer"><span className="green-circle"><Check size={15}/></span> See more shops. Make a smarter choice.</div>
            </div>
            <div className="floating-bubble bubble-bottom"><span className="circle-illustration">📍</span> Discover nearby options</div>
          </div>
        </section>

        <section className="container metric-grid">
          <div className="metric"><span className="metric-icon mint-bg"><ShoppingBasket size={22}/></span><div><strong>{stats.product_count}+</strong><small>Products to compare</small></div></div>
          <div className="metric"><span className="metric-icon blue-bg"><Store size={22}/></span><div><strong>{stats.shop_count}</strong><small>Sample local shops</small></div></div>
          <div className="metric"><span className="metric-icon purple-bg"><MapPin size={22}/></span><div><strong>{stats.district_count}</strong><small>Districts covered</small></div></div>
          <div className="metric"><span className="metric-icon orange-bg"><ShieldCheck size={22}/></span><div><strong>{stats.approved_report_count}</strong><small>Approved price records</small></div></div>
        </section>

        <section className="container section products-section">
          <div className="section-heading"><div><Pill kind="subtle">EXPLORE PRODUCTS</Pill><h2>What's on your shopping list?</h2><p>Search our sample catalogue and compare prices by shop.</p></div><button className="text-link" onClick={() => navigate('compare')}>View comparison <ArrowRight size={17}/></button></div>
          <div className="filter-row"><div className="searchbox"><Search size={18}/><input aria-label="Search products" placeholder="Search rice, dhal, coconut oil..." value={query} onChange={event=>setQuery(event.target.value)}/>{query && <button onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}</div></div>
          <div className="category-scroll">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`category ${category === item ? 'selected' : ''}`}>{item}</button>)}</div>
          {visibleProducts.length ? <div className="product-grid">{visibleProducts.map(product => <button className="product-card" key={product.id} onClick={()=>openProduct(product)}><span className="product-art">{symbolFor(product.name)}</span><span className="product-name">{product.name}</span><span className="product-meta">{product.quantity} {product.unit} • {product.category}</span><span className="product-action">Compare local prices <ArrowRight size={17}/></span></button>)}</div> : <Empty title="No products found" note="Try a different search or category."/>}
        </section>

        <section className="container why-section"><div className="why-intro"><Pill kind="mint">WHY PRICEPULSE?</Pill><h2>Better shopping starts with better information.</h2><p>We make local price submissions easier to discover and compare. Every entry shows when the price was observed.</p><button className="btn btn-dark" onClick={() => navigate('compare')}>Explore comparisons <ArrowUpRight size={17}/></button></div><div className="benefits"><div><span className="benefit-icon"><Search/></span><div><h3>Find products quickly</h3><p>Search everyday groceries and filter by category.</p></div></div><div><span className="benefit-icon"><TrendingDown/></span><div><h3>Compare fairly</h3><p>Compare matching pack sizes across multiple shops.</p></div></div><div><span className="benefit-icon"><HeartHandshake/></span><div><h3>Help your community</h3><p>Share prices that are checked before public display.</p></div></div></div></section>
      </>}

      {page === 'compare' && <section className="container section page-section">
        <div className="page-intro"><Pill kind="mint"><BarChart3 size={14}/> PRICE COMPARISON</Pill><h1>Find the better local price.</h1><p>Select a product and district to compare the latest approved price reported per shop.</p></div>
        <div className="compare-layout"><aside className="filter-panel"><h3><Filter size={18}/> Your filters</h3><label>Product<select value={selectedProductId} onChange={e => setSelectedProductId(Number(e.target.value))}>{products.map(product => <option key={product.id} value={product.id}>{product.name} ({product.quantity} {product.unit})</option>)}</select></label><label>District<select value={district} onChange={e => setDistrict(e.target.value)}><option value="">All districts</option>{districts.map(d => <option key={d} value={d}>{d}</option>)}</select></label><div className="side-info"><Info size={18}/><p>These prices are community reported. They can change in-store, so check each observation date.</p></div></aside>
          <div className="compare-results"><div className="compare-title"><div className="compare-product-emoji">{symbolFor(selectedProduct?.name)}</div><div><h2>{selectedProduct?.name || 'Selected product'}</h2><p>{selectedProduct?.quantity} {selectedProduct?.unit} • Same product size across shops</p></div></div>
            {loading ? <div className="loading"><LoaderCircle className="spin"/> Checking reported prices...</div> : comparison?.items?.length ? <>
              <div className="insight-grid"><div className="insight"><span><TrendingDown size={16}/> Lowest reported</span><strong>{price(cheapest.price_lkr)}</strong><small>{cheapest.shop_name}</small></div><div className="insight"><span><Wallet size={16}/> Price difference</span><strong>{price(spread)}</strong><small>Between listed shops</small></div><div className="insight"><span><Store size={16}/> Shops compared</span><strong>{comparison.items.length}</strong><small>{district || 'All available districts'}</small></div></div>
              <div className="results-card"><div className="results-card-heading"><h3>Shop-by-shop breakdown</h3><span>{comparison.items.length} results</span></div>{comparison.items.map((item, index) => { const maxPrice = Math.max(...comparison.items.map(r => Number(r.price_lkr))); return <div className="shop-row" key={item.shop_id}><div className="shop-icon"><Store size={21}/></div><div className="shop-details"><div className="shop-line"><strong>{item.shop_name}</strong>{index === 0 && <Pill kind="mint">Lowest</Pill>}</div><span><MapPin size={13}/>{item.city}, {item.district} • Updated {dateLabel(item.observed_at)}</span><div className="bar-track"><div className={`bar-fill ${index === 0 ? 'best-bar' : ''}`} style={{width: `${Math.max(8, Number(item.price_lkr) / maxPrice * 100)}%`}}/></div></div><div className="shop-price"><strong>{price(item.price_lkr)}</strong>{item.is_demo && <small>Demo</small>}</div></div>;})}</div>
            </> : <Empty title="No approved prices yet" note="Try another product or district. Public comparisons show approved reports only."/>}
            <div className="footnote"><ShieldCheck size={17}/> Demo values are illustrative. No connection to live retailer pricing is included.</div>
          </div>
        </div>
      </section>}

      {page === 'submit' && <section className="container section page-section"><div className="page-intro"><Pill kind="mint"><Plus size={14}/> CONTRIBUTE</Pill><h1>Spotted a price? Share it.</h1><p>Submit a grocery price you saw at a local shop. The report stays pending until an admin reviews it.</p></div><div className="form-layout"><form className="form-card" onSubmit={submitReport}><div className="form-card-title"><span className="form-icon"><Plus/></span><div><h2>New price report</h2><p>All fields are required</p></div></div><label>Product<select required value={reportForm.product_id} onChange={e => setReportForm({...reportForm, product_id:e.target.value})}>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}</select></label><label>Shop<select required value={reportForm.shop_id} onChange={e => setReportForm({...reportForm, shop_id:e.target.value})}>{shops.map(s => <option key={s.id} value={s.id}>{s.name} – {s.city}</option>)}</select></label><div className="two-fields"><label>Price (LKR)<input required min="0.01" step="0.01" type="number" placeholder="e.g. 245.00" value={reportForm.price_lkr} onChange={e => setReportForm({...reportForm, price_lkr:e.target.value})}/></label><label>Observed date<input required max={new Date().toISOString().slice(0,10)} type="date" value={reportForm.observed_at} onChange={e => setReportForm({...reportForm, observed_at:e.target.value})}/></label></div><button className="btn btn-primary full-width" type="submit" disabled={reportBusy || !products.length || !shops.length}>{reportBusy ? <LoaderCircle className="spin" size={17}/> : <ArrowRight size={17}/>} {session ? 'Submit for review' : 'Sign in to submit'}</button><p className="form-note"><Lock size={14}/> {backendOnline ? 'Reports are held for admin approval.' : 'Offline preview: submission requires running the backend.'}</p></form><div className="side-guide"><Pill kind="subtle">HOW IT WORKS</Pill><h2>A little help goes a long way.</h2><div className="guide-step"><span>01</span><div><h3>Choose the product</h3><p>Pick the correct grocery item and pack size.</p></div></div><div className="guide-step"><span>02</span><div><h3>Enter the price you saw</h3><p>Choose a shop and record the observation date.</p></div></div><div className="guide-step"><span>03</span><div><h3>Wait for approval</h3><p>Approved reports become available for comparisons.</p></div></div></div></div></section>}

      {page === 'my-reports' && <section className="container section page-section"><div className="page-intro"><Pill kind="mint">YOUR CONTRIBUTIONS</Pill><h1>My price reports</h1><p>Track your submissions and moderation status.</p></div>{!session ? <Empty title="Sign in first" note="Your submission history is linked to your account."/> : myReports.length ? <div className="table-card"><div className="table-head"><span>Product / Shop</span><span>Reported price</span><span>Observed date</span><span>Status</span></div>{myReports.map(r => <div className="table-row" key={r.id}><div><strong>{r.product_name}</strong><small>{r.shop_name}</small></div><span>{price(r.price_lkr)}</span><span>{dateLabel(r.observed_at)}</span><span><Pill kind={r.status==='APPROVED'?'mint':r.status==='REJECTED'?'danger':'warning'}>{r.status}</Pill></span></div>)}</div> : <Empty title="Nothing submitted yet" note="Use ‘Submit a price’ to make your first contribution."/>}</section>}

      {page === 'admin' && <section className="container section page-section"><div className="page-intro"><Pill kind="mint"><ShieldCheck size={14}/> ADMIN CONSOLE</Pill><h1>Price moderation queue</h1><p>Review pending community submissions. This page is available to admin accounts only.</p></div>{session?.role !== 'ADMIN' ? <Empty title="Admin access required" note="Sign in with an authorized admin account."/> : adminReports.length ? <div className="table-card"><div className="table-head admin-head"><span>Product / Shop</span><span>Reported by</span><span>Price</span><span>Actions</span></div>{adminReports.map(r => <div className="table-row admin-row" key={r.id}><div><strong>{r.product_name}</strong><small>{r.shop_name} • {dateLabel(r.observed_at)}</small></div><span>{r.submitted_by_name || 'Unknown'}</span><span>{price(r.price_lkr)}</span><div className="review-actions"><button disabled={reviewBusy===r.id} className="btn btn-approve btn-small" onClick={()=>moderate(r.id,'APPROVED')}><Check size={15}/> Approve</button><button disabled={reviewBusy===r.id} className="btn btn-reject btn-small" onClick={()=>moderate(r.id,'REJECTED')}><X size={15}/> Reject</button></div></div>)}</div> : <Empty icon={ShieldCheck} title="No pending reports" note="New reports awaiting approval will appear here."/>}</section>}
    </main>
    <footer className="footer"><div className="container footer-inner"><div><strong><ShoppingBasket size={18}/> Price<span>Pulse</span></strong><p>A transparent community price comparison prototype.</p></div><div className="footer-right"><span><ShieldCheck size={15}/> Academic demo — verify before shopping</span><span>SWYNEX Task 01 • Architecture starter</span></div></div></footer>

    {authOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget) setAuthOpen(false)}}><div className="auth-modal" role="dialog" aria-modal="true" aria-label={authMode==='login'?'Sign in':'Create account'}><button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Close"><X size={19}/></button><span className="modal-logo"><ShoppingBasket size={24}/></span><h2>{authMode==='login'?'Welcome back':'Create your account'}</h2><p>{authMode==='login'?'Sign in to contribute verified price reports.':'Join the PricePulse community to share prices.'}</p>{!backendOnline && <div className="auth-warning"><Info size={16}/> Start the backend first to use accounts.</div>}<form onSubmit={authenticate}>{authMode==='register' && <label>Your name<input required name="name" minLength={2} maxLength={100} placeholder="Your full name"/></label>}<label>Email address<input required name="email" type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Password<input required name="password" type="password" minLength={8} autoComplete={authMode==='login'?'current-password':'new-password'} placeholder="At least 8 characters"/></label><button type="submit" className="btn btn-primary full-width" disabled={authBusy || !backendOnline}>{authBusy ? <LoaderCircle size={17} className="spin"/> : <LogIn size={17}/>} {authMode==='login'?'Sign in':'Create account'}</button></form><div className="auth-switch">{authMode==='login'?'New here?':'Already have an account?'} <button onClick={()=>{setAuthMode(authMode==='login'?'register':'login'); setNotice('')}}>{authMode==='login'?'Create an account':'Sign in'}</button></div>{notice && <div className="modal-error">{notice}</div>}</div></div>}
  </div>;
}
