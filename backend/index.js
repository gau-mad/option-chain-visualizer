const express = require('express');
const cors = require('cors');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

const STOCKS = [
  { symbol: 'NIFTY', file: 'optionchain_nifty.csv' },
  { symbol: 'RELIANCE', file: 'optionchain_reliance.csv' },
  { symbol: 'HDFCBANK', file: 'optionchain_hdfcbank.csv' },
  { symbol: 'INFY', file: 'optionchain_infy.csv' }
];

const app = express();
app.use(cors());

app.get('/api/option-chain', async (req, res) => {
  try {
    const symbol = (req.query.symbol || "NIFTY").toUpperCase();
    const stock = STOCKS.find(s => s.symbol === symbol);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    const csvPath = path.join(__dirname, stock.file);
    if (!fs.existsSync(csvPath)) throw new Error(`CSV not found for ${symbol}`);

    const rows = await csv().fromFile(csvPath);
    if (rows.length > 0) {
      console.log(`[${symbol}] sample row:`, rows[0]);
    }

    const formatted = rows
      .filter(row => row["STRIKE"])
      .map(row => ({
        strikePrice: Number(row["STRIKE"].replace(/,/g, "")),

        // CALL side
        callOI: row["OI_c"] ? Number(row["OI_c"].replace(/,/g, "")) : null,
        callChngOI: row["CHNG_IN_OI_c"] ? Number(row["CHNG_IN_OI_c"].replace(/,/g, "")) : null,
        callVolume: row["VOLUME_c"] ? Number(row["VOLUME_c"].replace(/,/g, "")) : null,
        callIV: row["IV_c"] ? Number(row["IV_c"].replace(/,/g, "")) : null,
        callLTP: row["LTP_c"] ? Number(row["LTP_c"].replace(/,/g, "")) : null,

        // PUT side
        putOI: row["OI"] ? Number(row["OI"].replace(/,/g, "")) : null,
        putChngOI: row["CHNG_IN_OI"] ? Number(row["CHNG_IN_OI"].replace(/,/g, "")) : null,
        putVolume: row["VOLUME"] ? Number(row["VOLUME"].replace(/,/g, "")) : null,
        putIV: row["IV"] ? Number(row["IV"].replace(/,/g, "")) : null,
        putLTP: row["LTP"] ? Number(row["LTP"].replace(/,/g, "")) : null,
      }));

    res.json({ data: formatted, symbol });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load option chain CSV: ' + error.message });
  }
});

app.get('/api/stocks', (req, res) => {
  res.json(STOCKS.map(s => s.symbol));
});

app.listen(4000, () => console.log('Backend running on port 4000'));