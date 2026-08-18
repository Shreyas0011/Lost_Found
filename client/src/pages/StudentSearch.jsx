import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import { Search, Calendar, MapPin, ArrowRight, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function StudentSearch() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (location) params.set('location_found', location);
      if (color) params.set('color', color);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const data = await apiFetch(`/items?${params.toString()}`);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, location, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const clearFilters = () => {
    setQ('');
    setCategory('');
    setLocation('');
    setColor('');
    setDateFrom('');
    setDateTo('');
    fetchItems();
  };

  return (
    <main className="page">
      {/* Header */}
      <header className="page-header" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-2xl)' }}>
        <div className="page-header__eyebrow">
          <Sparkles size={14} /> Official Item Registry
        </div>
        <h1 className="page-header__title">Search Lost &amp; Found</h1>
        <p className="page-header__sub">Browse published property found across campus. Recognize an item belonging to you? Submit a claim to initiate verification.</p>
      </header>

      {/* Capsule Search Bar */}
      <div style={{ maxWidth: '720px', margin: '0 auto var(--space-2xl)' }}>
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <span style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', color: 'var(--clr-primary)' }}>
            <Search size={22} />
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by brand, color, category, or keyword…"
          />
          <button type="submit" className="btn btn--primary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
            Search Registry
          </button>
        </form>
      </div>

      {/* Filter Container Card */}
      <div className="filters-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', fontSize: '0.86rem', fontWeight: 700, color: 'var(--clr-primary-dark)' }}>
          <Layers size={16} /> Filter Results
        </div>
        <div className="filters">
          <div className="filter-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option>Electronics</option><option>Clothing</option><option>Books</option>
              <option>ID / Cards</option><option>Accessories</option><option>Bags</option>
              <option>Keys</option><option>Stationery</option><option>Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Location Found</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All Locations</option>
              <option>Library</option><option>Cafeteria</option><option>Classroom</option>
              <option>Hostel</option><option>Parking</option><option>Sports Area</option>
              <option>Administrative Block</option><option>Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Color</label>
            <input
              type="text"
              placeholder="e.g. Black"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={fetchItems}
            />
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div className="filter-group" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={clearFilters}>
              <RefreshCw size={13} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.94rem', fontWeight: 600 }}>
          Showing {items.length} published item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Item Cards Grid */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--clr-border)', padding: 'var(--space-3xl)' }}>
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">No items found</p>
          <p className="empty-state__text">Try adjusting your search criteria or resetting filters.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const title = [item.color, item.brand, item.category].filter(Boolean).join(' ') || item.category;
            const icon = getCategoryIcon(item.category);
            return (
              <div
                key={item._id}
                className="item-card"
                onClick={() => navigate(`/item/${item._id}`)}
              >
                <div className="item-card__img">
                  {item.image_url ? (
                    <img src={getImageUrl(item.image_url)} alt={title} loading="lazy" />
                  ) : (
                    <span style={{ fontSize: '3.8rem' }}>{icon}</span>
                  )}
                  <div className="item-card__category-tag">
                    {icon} {item.category}
                  </div>
                </div>

                <div className="item-card__body">
                  <p className="item-card__title">{title}</p>
                  <div className="item-card__meta">
                    <span><MapPin size={15} color="var(--clr-primary)" /> {item.location_found}</span>
                    <span><Calendar size={15} color="var(--clr-text-dim)" /> Found {formatDate(item.date_found)}</span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)' }}>
                    <button className="btn btn--primary btn--sm btn--full" style={{ justifyContent: 'space-between' }}>
                      <span>View Details &amp; Claim</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
