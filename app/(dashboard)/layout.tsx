'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: HomeIcon },
  { label: 'List', path: '/search', icon: ListIcon },
  { label: 'Map', path: '/map', icon: MapIcon },
  { label: 'Mypage', path: '/mypage', icon: PersonIcon },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentIndex = NAV_ITEMS.findIndex((item) => {
    if (pathname === item.path) return true;
    if (item.path === '/map' && pathname.startsWith('/team/')) return true;
    if (item.path !== '/home' && pathname.startsWith(item.path)) return true;
    return false;
  });
  const navValue = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
      <Container maxWidth="xl" component="main" sx={{ py: 2 }}>
        {children}
      </Container>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <BottomNavigation
          value={navValue}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-label': { fontWeight: 600 },
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={<item.icon />}
              component={Link}
              href={item.path}
              sx={{
                color:
                  pathname === item.path ||
                  (item.path === '/map' && pathname.startsWith('/team/')) ||
                  (item.path !== '/home' && pathname.startsWith(item.path))
                    ? 'primary.main'
                    : 'text.secondary',
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
