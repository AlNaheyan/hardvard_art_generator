import { useState, useEffect } from 'react';
import './App.css';

const apiKey = import.meta.env.VITE_API_KEY;

function App() {
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [banList, setBanList] = useState([]);

  const fetchRandomArtwork = async () => {
    setLoading(true);
    setError(null);

    try {
      const randomPage = Math.floor(Math.random() * 100) + 1;
      let url = `https://api.harvardartmuseums.org/object?apikey=${apiKey}&size=1&page=${randomPage}&hasimage=1&classification=Paintings&sort=random`;

      // Apply ban list filters
      if (banList.length > 0) {
        const bannedPeople = banList.filter(item => item.type === 'people').map(item => item.value);
        const bannedCenturies = banList.filter(item => item.type === 'century').map(item => item.value);
        const bannedCultures = banList.filter(item => item.type === 'culture').map(item => item.value);

        if (bannedPeople.length > 0) {
          url += `&person=${bannedPeople.map(p => `!${p}`).join('|')}`;
        }
        if (bannedCenturies.length > 0) {
          url += `&century=${bannedCenturies.map(c => `!${c}`).join('|')}`;
        }
        if (bannedCultures.length > 0) {
          url += `&culture=${bannedCultures.map(c => `!${c}`).join('|')}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch artwork');

      const data = await response.json();

      if (data.records.length === 0) {
        return fetchRandomArtwork(); // Retry if no results
      }
      console.log("Fetching from URL:", url);

      const artwork = data.records[0];
      setCurrentItem({
        title: artwork.title || 'Untitled',
        artist: artwork.people ? artwork.people[0]?.name : 'Unknown artist',
        century: artwork.century || 'Unknown period',
        imageUrl: artwork.primaryimageurl,
        culture: artwork.culture || 'Unknown culture',
        id: artwork.id
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching artwork:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBanItem = (type, value) => {
    if (!value || value === 'Unknown culture') return; // Prevent banning invalid values
    const isBanned = banList.some(item => item.type === type && item.value === value);

    if (isBanned) {
      setBanList(banList.filter(item => !(item.type === type && item.value === value)));
    } else {
      setBanList([...banList, { type, value }]);
    }
  };

  const isAttributeBanned = (type, value) => {
    return banList.some(item => item.type === type && item.value === value);
  };

  useEffect(() => {
    fetchRandomArtwork();
  }, [banList]);

  return (
    <div className="app">
      <h1>Art Discover</h1>
      <p className="subtitle">Click "Discover" to see random artworks. Click on artist, century, or culture to ban/unban.</p>

      <div className="ban-list">
        <h3>Ban List:</h3>
        {banList.length === 0 ? (
          <p>No items banned yet</p>
        ) : (
          <ul>
            {banList.map((item, index) => (
              <li 
                key={index} 
                onClick={() => handleBanItem(item.type, item.value)}
                className="ban-item"
              >
                {item.value} ({item.type})
              </li>
            ))}
          </ul>
        )}
      </div>

      <button 
        onClick={fetchRandomArtwork} 
        disabled={loading}
        className="discover-button"
      >
        {loading ? 'Loading...' : 'Discover'}
      </button>

      {error && <p className="error">{error}</p>}

      {currentItem && (
        <div className="artwork-container">
          <div className="artwork-image">
            {currentItem.imageUrl ? (
              <img src={currentItem.imageUrl} alt={currentItem.title} />
            ) : (
              <div className="no-image">No image available</div>
            )}
          </div>

          <div className="artwork-info">
            <h2>{currentItem.title}</h2>
            <p>
              <span 
                className={`attribute ${isAttributeBanned('people', currentItem.artist) ? 'banned' : ''}`}
                onClick={() => handleBanItem('people', currentItem.artist)}
              >
                Artist: {currentItem.artist}
              </span>
            </p>
            <p>
              <span 
                className={`attribute ${isAttributeBanned('century', currentItem.century) ? 'banned' : ''}`}
                onClick={() => handleBanItem('century', currentItem.century)}
              >
                Century: {currentItem.century}
              </span>
            </p>
            <p>
              <span
                className={`attribute ${isAttributeBanned('culture', currentItem.culture) ? 'banned' : ''}`}
                onClick={() => handleBanItem('culture', currentItem.culture)}
              >
                Culture: {currentItem.culture}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
