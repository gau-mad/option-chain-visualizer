import React, { useEffect, useState } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box,
  AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Container, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow,
  TableSortLabel, TextField, Tooltip, TableContainer, Button, Dialog, DialogTitle, DialogContent
} from "@mui/material";
import {
  ExpandLess, ExpandMore,
  Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon,
  ListAlt as ListAltIcon, Equalizer as EqualizerIcon, Settings as SettingsIcon,
  ShowChart as ShowChartIcon, BarChart as BarChartIcon, GroupWork as GroupWorkIcon, LocalOffer as LocalOfferIcon,
  ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon, FiberManualRecord as FiberManualRecordIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

// Collapsible sidebar with grouped sections
function Sidebar({ open, selectedSection, setSelectedSection, sidebarOpen, setSidebarOpen }) {
  const [openChain, setOpenChain] = useState(true);
  const [openGraph, setOpenGraph] = useState(false);

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? 220 : 60,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        zIndex: 1250,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? 220 : 60,
          transition: 'width 0.2s',
          overflowX: 'hidden',
          bgcolor: "background.paper",
          borderRight: 0,
          boxShadow: 2
        }
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "space-between" : "center",
          px: [1]
        }}>
        {sidebarOpen ? <span /> : null}
        <IconButton onClick={() => setSidebarOpen(v => !v)} size="small">
          {sidebarOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Toolbar>
      <List component="nav">
        {/* Option Chain section */}
        <ListItemButton onClick={() => setOpenChain(!openChain)}>
          <ListItemIcon><ListAltIcon /></ListItemIcon>
          {sidebarOpen && <ListItemText primary="Option Chain" />}
          {openChain ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openChain && sidebarOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 3 }}>
            <ListItemButton selected={selectedSection === "optionChain"}
              sx={{ my: .5, borderRadius: 2 }}
              onClick={() => setSelectedSection("optionChain")}>
              <ListItemIcon><ShowChartIcon /></ListItemIcon>
              <ListItemText primary="Chain Table" />
            </ListItemButton>
          </List>
        </Collapse>
        {/* OI Graphs section */}
        <ListItemButton onClick={() => setOpenGraph(!openGraph)}>
          <ListItemIcon><EqualizerIcon /></ListItemIcon>
          {sidebarOpen && <ListItemText primary="OI Graphs" />}
          {openGraph ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openGraph && sidebarOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 3 }}>
            <ListItemButton selected={selectedSection === "optionChart"}
              sx={{ my: .5, borderRadius: 2 }}
              onClick={() => setSelectedSection("optionChart")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Open Interest" />
            </ListItemButton>
          </List>
        </Collapse>
        {/* Settings */}
        <ListItemButton>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          {sidebarOpen && <ListItemText primary="Settings" />}
        </ListItemButton>
      </List>
    </Drawer>
  );
}

function colorOI(val) {
  if (val > 2000) return "#ffe082";
  if (val > 1000) return "#fffde7";
  return "transparent";
}
function colorChng(val) {
  if (val > 0) return "#c8e6c9";
  if (val < 0) return "#ffcdd2";
  return "transparent";
}
function chngIcon(val) {
  if (val > 0) return <ArrowUpwardIcon sx={{ fontSize: 15, mb: '-2px', color: "success.main" }} />;
  if (val < 0) return <ArrowDownwardIcon sx={{ fontSize: 15, mb: '-2px', color: "error.main" }} />;
  return null;
}

// ----------------------------------------------------------
function AppContent({
  selectedSection,
  showChartDialog,
  setShowChartDialog
}) {
  // All your React state as before
  const [optionData, setOptionData] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('strikePrice');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spotPrice, setSpotPrice] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [symbol, setSymbol] = useState('NIFTY');

  useEffect(() => {
    fetch('http://localhost:4000/api/stocks')
      .then(res => res.json())
      .then(setStocks)
      .catch(() => setStocks([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`http://localhost:4000/api/option-chain?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setOptionData(data.data || []);
        setSpotPrice(null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'API error!');
        setLoading(false);
      });
  }, [symbol]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setOptionData(optionData.slice().sort((a, b) => {
      if ((a[property] ?? -Infinity) < (b[property] ?? -Infinity)) return isAsc ? -1 : 1;
      if ((a[property] ?? -Infinity) > (b[property] ?? -Infinity)) return isAsc ? 1 : -1;
      return 0;
    }));
  };

  const filteredData = optionData.filter(row =>
    String(row.strikePrice).includes(search)
  );

  const chartData = filteredData.map(row => ({
    ...row,
    callOI: row.callOI ?? 0,
    putOI: row.putOI ?? 0,
  }));

  // Main Table Section
  const chainTable = (
    <>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ pr: 1 }}>
          <ShowChartIcon sx={{ mb: -.5, color: "primary.main", fontSize: 32 }} /> Option Chain
        </Typography>
        <FiberManualRecordIcon sx={{ color: '#76ff03', fontSize: 15, verticalAlign: 'middle', ml: 1, mr: .5 }} />
        <Typography variant="h6" color="success.main">{symbol}</Typography>
      </Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: "flex", gap: 2, alignItems: "center", boxShadow: 3 }}>
        <TextField select label="Select Stock" value={symbol}
          onChange={e => setSymbol(e.target.value)} SelectProps={{ native: true }}
          size="small" sx={{ minWidth: 150 }}>
          {stocks.map(s => (<option key={s} value={s}>{s}</option>))}
        </TextField>
        <TextField label="Search Strike" variant="outlined" size="small" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 170 }} />
        <Button
          variant="outlined" color="primary"
          onClick={() => setShowChartDialog(true)}
          startIcon={<BarChartIcon />}
        >
          Show OI Chart
        </Button>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
          <TableContainer>
            <Table sx={{ minWidth: 900 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ bgcolor: "#e3f2fd", color: "primary.main", fontWeight: 600, fontSize: 17, border: 0 }}>
                    <Tooltip title="Call Option Data"><GroupWorkIcon color="primary" sx={{ mb: -.2, mr: .5 }} />CALL</Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17, bgcolor: "#fff8e1", border: 0 }}>
                    <LocalOfferIcon fontSize="small" color="warning" sx={{ mb: -.35, mr: .4 }} />STRIKE
                  </TableCell>
                  <TableCell colSpan={4} align="center" sx={{ bgcolor: "#fbe9e7", color: "error.main", fontWeight: 600, fontSize: 17, border: 0 }}>
                    <Tooltip title="Put Option Data"><GroupWorkIcon sx={{ color: '#e53935', mb: -.2, mr: .5 }} />PUT</Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <Tooltip title="Call OI"><TableCell align="right">
                    <TableSortLabel active={orderBy === "callOI"} direction={orderBy === "callOI" ? order : 'asc'}
                      onClick={() => handleSort("callOI")}>OI</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Call Change in OI"><TableCell align="right">
                    <TableSortLabel active={orderBy === "callChngOI"} direction={orderBy === "callChngOI" ? order : 'asc'}
                      onClick={() => handleSort("callChngOI")}>CHNG OI</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Call Volume"><TableCell align="right">
                    <TableSortLabel active={orderBy === "callVolume"} direction={orderBy === "callVolume" ? order : 'asc'}
                      onClick={() => handleSort("callVolume")}>VOLUME</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Call IV"><TableCell align="right">
                    <TableSortLabel active={orderBy === "callIV"} direction={orderBy === "callIV" ? order : 'asc'}
                      onClick={() => handleSort("callIV")}>IV</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Strike"><TableCell align="center">
                    <TableSortLabel active={orderBy === "strikePrice"} direction={orderBy === "strikePrice" ? order : 'asc'}
                      onClick={() => handleSort("strikePrice")}>Strike</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Put IV"><TableCell align="right">
                    <TableSortLabel active={orderBy === "putIV"} direction={orderBy === "putIV" ? order : 'asc'}
                      onClick={() => handleSort("putIV")}>IV</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Put Volume"><TableCell align="right">
                    <TableSortLabel active={orderBy === "putVolume"} direction={orderBy === "putVolume" ? order : 'asc'}
                      onClick={() => handleSort("putVolume")}>VOLUME</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Put Change in OI"><TableCell align="right">
                    <TableSortLabel active={orderBy === "putChngOI"} direction={orderBy === "putChngOI" ? order : 'asc'}
                      onClick={() => handleSort("putChngOI")}>CHNG OI</TableSortLabel></TableCell></Tooltip>
                  <Tooltip title="Put OI"><TableCell align="right">
                    <TableSortLabel active={orderBy === "putOI"} direction={orderBy === "putOI" ? order : 'asc'}
                      onClick={() => handleSort("putOI")}>OI</TableSortLabel></TableCell></Tooltip>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, idx) => (
                  <TableRow key={idx} hover sx={{
                    backgroundColor: spotPrice && Math.abs(row.strikePrice - spotPrice) < 1e-2 ? "#e3f2fd" : undefined
                  }}>
                    <TableCell align="right" sx={{
                      bgcolor: colorOI(row.callOI),
                      fontWeight: row.callOI > 2000 ? 700 : undefined
                    }}>{row.callOI ?? '—'}</TableCell>
                    <TableCell align="right" sx={{
                      bgcolor: colorChng(row.callChngOI),
                      color: row.callChngOI > 0 ? "success.main" : row.callChngOI < 0 ? "error.main" : "text.primary",
                      fontWeight: 500
                    }}>{row.callChngOI ?? '—'} {chngIcon(row.callChngOI)}</TableCell>
                    <TableCell align="right" sx={{
                      fontWeight: row.callVolume > 1000 ? 700 : undefined,
                      color: row.callVolume > 1000 ? "primary.dark" : "text.primary"
                    }}>{row.callVolume ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ color: "info.main" }}>{row.callIV ?? '—'}</TableCell>
                    <TableCell align="center" sx={{
                      bgcolor: "#fff8e1", fontWeight: 700, color: "warning.dark"
                    }}>{row.strikePrice}</TableCell>
                    <TableCell align="right" sx={{ color: "info.main" }}>{row.putIV ?? '—'}</TableCell>
                    <TableCell align="right" sx={{
                      fontWeight: row.putVolume > 1000 ? 700 : undefined,
                      color: row.putVolume > 1000 ? "primary.dark" : "text.primary"
                    }}>{row.putVolume ?? '—'}</TableCell>
                    <TableCell align="right" sx={{
                      bgcolor: colorChng(row.putChngOI),
                      color: row.putChngOI > 0 ? "success.main" : row.putChngOI < 0 ? "error.main" : "text.primary",
                      fontWeight: 500
                    }}>{row.putChngOI ?? '—'} {chngIcon(row.putChngOI)}</TableCell>
                    <TableCell align="right" sx={{
                      bgcolor: colorOI(row.putOI),
                      fontWeight: row.putOI > 2000 ? 700 : undefined
                    }}>{row.putOI ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );

  // Chart Dialog Section (Option Chart)
  const chartContent = (
    <Dialog open={showChartDialog} onClose={() => setShowChartDialog(false)} maxWidth="lg" fullWidth>
      <DialogTitle>
        <BarChartIcon sx={{ mr: 1, mb: '-3px', color: "primary.main" }} />
        Option Chain Open Interest Chart
      </DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="strikePrice" />
              <YAxis />
              <ReTooltip />
              <Legend />
              <Bar dataKey="callOI" fill="#1976d2" name="Call OI" />
              <Bar dataKey="putOI" fill="#e53935" name="Put OI" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </DialogContent>
    </Dialog>
  );

  // Standalone Chart Section (for sidebar navigation)
  const pageChart = (
    <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
      <Typography variant="h6" sx={{ mt: 2, mb: 0, fontWeight: 700 }} color="primary">
        <BarChartIcon sx={{ mb: -.5, mr: .7 }} /> Open Interest Chart
      </Typography>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <XAxis dataKey="strikePrice" />
          <YAxis />
          <ReTooltip />
          <Legend />
          <Bar dataKey="callOI" fill="#1976d2" name="Call OI" />
          <Bar dataKey="putOI" fill="#e53935" name="Put OI" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );

  // Only show table or chart depending on sidebar nav
  return (
    <>
      {selectedSection === "optionChain" && chainTable}
      {selectedSection === "optionChart" && pageChart}
      {chartContent}
    </>
  );
}

// Top-level App
function App() {
  const [mode, setMode] = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("optionChain");
  const [showChartDialog, setShowChartDialog] = useState(false);
  const theme = createTheme({
    palette: { mode },
    typography: { fontFamily: "'Roboto','Segoe UI',sans-serif" }
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="fixed" elevation={6} color="primary" sx={{ zIndex: 1300 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, letterSpacing: 1.5 }}>
              🚀 Option Chain Pro
            </Typography>
            <IconButton color="inherit" onClick={() => setMode(mode === "light" ? "dark" : "light")}>
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <Sidebar
          open={sidebarOpen}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <Box
          component="main"
          sx={{
            ml: sidebarOpen ? '220px' : '60px',
            pt: 10,
            pb: 4,
            transition: 'margin-left 0.2s',
            maxWidth: '100vw',
          }}>
          <AppContent
            selectedSection={selectedSection}
            showChartDialog={showChartDialog}
            setShowChartDialog={setShowChartDialog}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;