import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe, Menu, X } from 'lucide-react';
import gophoraLogo from '@/assets/gophora-logo.png';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, isAdmin, accountType } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = user ? [
    { path: accountType === 'company' ? '/company' : '/explorer', label: t('nav.dashboard') },
    ...(accountType === 'explorer' ? [
      { path: '/marketplace', label: language === 'es' ? 'Trabajo' : 'Work' },
      { path: '/academy', label: 'Dream Academy' },
    ] : []),
    ...(accountType === 'company' ? [{ path: '/projects/create', label: t('nav.projects') }] : []),
    ...(isAdmin ? [{ path: '/admin', label: t('nav.admin') }] : []),
  ] : [
    { path: '/about', label: t('nav.about') },
    { path: '/faq', label: t('nav.faq') },
    { path: '/organizations', label: t('nav.organizations') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={gophoraLogo} alt="GOPHORA" className="h-12 dark:invert" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Button
                variant={isActive(link.path) ? 'secondary' : 'ghost'}
                size="sm"
                className="font-heading text-xs tracking-wide"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleLang} title="Toggle language">
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle theme">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex font-heading text-xs">
              {t('nav.logout')}
            </Button>
          ) : (
            <div className="hidden md:flex gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-heading text-xs">{t('nav.login')}</Button>
              </Link>
              <Link to="/register">
                <Button
                  variant={isActive('/register') ? 'outline' : 'ghost'}
                  size="sm"
                  className="font-heading text-xs"
                >
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background p-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
                <Button variant={isActive(link.path) ? 'secondary' : 'ghost'} className="w-full justify-start font-heading text-sm">
                  {link.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" onClick={logout} className="w-full justify-start font-heading text-sm">
                {t('nav.logout')}
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-heading text-sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full font-heading text-sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
