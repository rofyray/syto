import { useState, useEffect } from 'react';

const HackathonBadge = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Set initial state
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const badgeUrl = isDarkMode
    ? 'https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/main/src/public/bolt-badge/white_circle_360x360/white_circle_360x360.svg'
    : 'https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/main/src/public/bolt-badge/black_circle_360x360/black_circle_360x360.svg';

  return (
    <a href="https://bolt.new/" target="_blank" rel="noopener noreferrer" className="absolute top-20 right-4 z-50">
      <img src={badgeUrl} alt="Bolt Hackathon Badge" className="h-16 w-16" />
    </a>
  );
};

export default HackathonBadge;
