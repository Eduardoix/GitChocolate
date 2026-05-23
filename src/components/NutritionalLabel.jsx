import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const NutritionalLabel = ({ 
  data = {}, 
  ingredients = [], 
  config = {},
  lote = '',
  validade = '',
  title = '',
  portionSize = 100,
  portionDescription = '',
  servingsPerContainer = '10',
  containsLactose = true,
  containsGluten = false,
  cocoaPerc = 0
}) => {
  const {
    showTitle = true,
    showLogo = false,
    logoUrl = '',
    showQR = false,
    qrType = 'site',
    qrValue = '',
    showLote = false,
    showValidade = false,
    fontSize = 0.8,
    width = 75,
    showIngredients = true
  } = (config || {});

  const defaultData = {
    kcal: 0, carb: 0, sugarTotal: 0, sugarAdded: 0,
    protein: 0, fatTotal: 0, fatSat: 0, fatTrans: 0,
    fiber: 0, sodium: 0
  };

  const d = { ...defaultData, ...(data || {}) };
  
  // d values are per 100g
  // Calculate portion values
  const factor = portionSize / 100;
  const p = {
    kcal: (d.kcal * factor).toFixed(0),
    carb: (d.carb * factor).toFixed(1).replace('.', ','),
    sugarTotal: (d.sugarTotal * factor).toFixed(1).replace('.', ','),
    sugarAdded: (d.sugarAdded * factor).toFixed(1).replace('.', ','),
    protein: (d.protein * factor).toFixed(1).replace('.', ','),
    fatTotal: (d.fatTotal * factor).toFixed(1).replace('.', ','),
    fatSat: (d.fatSat * factor).toFixed(1).replace('.', ','),
    fatTrans: (d.fatTrans * factor).toFixed(1).replace('.', ','),
    fiber: (d.fiber * factor).toFixed(1).replace('.', ','),
    sodium: (d.sodium * factor).toFixed(0),
  };

  // Replace ,0 with empty if you want, but ANVISA usually accepts it.
  const formatNum = (str) => str.endsWith(',0') ? str.replace(',0', '') : str;

  // Lupa logic (Front-of-pack warning)
  const isHighFatSat = d.fatSat >= 6;
  const isHighSugarAdded = d.sugarAdded >= 15;
  const isHighSodium = d.sodium >= 600;

  const highAttributes = [];
  if (isHighSugarAdded) highAttributes.push('AÇÚCAR ADICIONADO');
  if (isHighFatSat) highAttributes.push('GORDURA SATURADA');
  if (isHighSodium) highAttributes.push('SÓDIO');

  // Sort ingredients by percentage descending
  const sortedIngredients = [...ingredients].sort((a, b) => b.perc - a.perc);
  const ingredientsString = sortedIngredients.map(i => i.nome).join(', ');

  const getVD = (val, ref) => {
    if (!val) return '0';
    const numVal = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : parseFloat(val);
    if (isNaN(numVal)) return '0';
    const vd = Math.round((numVal / ref) * 100);
    return vd;
  };

  return (
    <div 
      className="nutritional-label-container" 
      style={{ 
        width: width ? `${width}mm` : '300px', 
        fontSize: `${fontSize}rem`,
      }}
    >
      {showTitle && title && (
        <div className="label-custom-title">{title}</div>
      )}

      {highAttributes.length > 0 && (
        <div className="lupa-container">
          <div className="lupa-box">
            <div className="lupa-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div className="lupa-text">
              <span className="alto-em">ALTO EM</span>
              <div className="lupa-items">
                {highAttributes.map((attr, idx) => (
                  <span key={idx} className="lupa-item">{attr}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="nutritional-label">
        <div className="label-header">INFORMAÇÃO NUTRICIONAL</div>
        
        <div className="label-portions">
          <div>Porções por embalagem: {servingsPerContainer}</div>
          <div>Porção: {portionSize}g {portionDescription ? `(${portionDescription})` : ''}</div>
        </div>
        
        <table className="nutrition-table">
          <thead>
            <tr className="header-row">
              <th className="col-label"></th>
              <th className="col-val">100g</th>
              <th className="col-vd">%VD*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="col-label">Valor energético (kcal)</td>
              <td className="col-val">{formatNum(p.kcal)}</td>
              <td className="col-vd">{getVD(p.kcal, 2000)}</td>
            </tr>
            <tr>
              <td className="col-label">Carboidratos (g)</td>
              <td className="col-val">{formatNum(p.carb)}</td>
              <td className="col-vd">{getVD(p.carb, 300)}</td>
            </tr>
            <tr className="indent">
              <td className="col-label">Açúcares totais (g)</td>
              <td className="col-val">{formatNum(p.sugarTotal)}</td>
              <td className="col-vd"></td>
            </tr>
            <tr className="indent">
              <td className="col-label">Açúcares adicionados (g)</td>
              <td className="col-val">{formatNum(p.sugarAdded)}</td>
              <td className="col-vd">{getVD(p.sugarAdded, 50)}</td>
            </tr>
            <tr>
              <td className="col-label">Proteínas (g)</td>
              <td className="col-val">{formatNum(p.protein)}</td>
              <td className="col-vd">{getVD(p.protein, 50)}</td>
            </tr>
            <tr>
              <td className="col-label">Gorduras totais (g)</td>
              <td className="col-val">{formatNum(p.fatTotal)}</td>
              <td className="col-vd">{getVD(p.fatTotal, 65)}</td>
            </tr>
            <tr className="indent">
              <td className="col-label">Gorduras saturadas (g)</td>
              <td className="col-val">{formatNum(p.fatSat)}</td>
              <td className="col-vd">{getVD(p.fatSat, 20)}</td>
            </tr>
            <tr className="indent">
              <td className="col-label">Gorduras trans (g)</td>
              <td className="col-val">{formatNum(p.fatTrans)}</td>
              <td className="col-vd"></td>
            </tr>
            <tr>
              <td className="col-label">Fibras alimentares (g)</td>
              <td className="col-val">{formatNum(p.fiber)}</td>
              <td className="col-vd">{getVD(p.fiber, 25)}</td>
            </tr>
            <tr>
              <td className="col-label">Sódio (mg)</td>
              <td className="col-val">{formatNum(p.sodium)}</td>
              <td className="col-vd">{getVD(p.sodium, 2000)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="label-footer">
          *Percentual de valores diários fornecidos pela porção.
        </div>
      </div>

      <div className="ingredients-section mt-1">
        <div><strong>INGREDIENTES:</strong> {ingredientsString}.</div>
        {contemLactose && (
          <div className="allergen-alert"><strong>CONTÉM LACTOSE</strong></div>
        )}
        {!contemLactose && (
          <div className="allergen-alert"><strong>NÃO CONTÉM LACTOSE</strong></div>
        )}
        {contemGluten && (
          <div className="allergen-alert"><strong>CONTÉM GLÚTEN</strong></div>
        )}
        {!contemGluten && (
          <div className="allergen-alert"><strong>NÃO CONTÉM GLÚTEN</strong></div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .nutritional-label-container {
          background: white;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .label-custom-title {
          font-weight: 800;
          font-size: 1.4em;
          text-align: center;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .lupa-container {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        .lupa-box {
          border: 2px solid black;
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          align-items: stretch;
          gap: 12px;
          background: white;
        }
        .lupa-icon {
          width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lupa-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .alto-em {
          font-weight: 800;
          font-size: 1em;
          line-height: 1;
          margin-bottom: 2px;
        }
        .lupa-items {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .lupa-item {
          font-weight: 900;
          font-size: 0.9em;
          background: black;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          line-height: 1;
          text-align: center;
        }
        .nutritional-label {
          border: 1px solid black;
          padding: 10px;
        }
        .label-header {
          font-weight: 900;
          font-size: 1.1em;
          border-bottom: 3px solid black;
          padding-bottom: 4px;
          margin-bottom: 6px;
          text-align: center;
        }
        .label-portions {
          font-size: 0.9em;
          margin-bottom: 8px;
        }
        .nutrition-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-bottom: 4px;
        }
        .header-row th {
          border-top: 3px solid black;
          border-bottom: 1px solid black;
          font-size: 0.85em;
          padding: 6px 0;
          font-weight: bold;
        }
        .nutrition-table .col-label { width: 55%; text-align: left; }
        .nutrition-table .col-val { width: 25%; text-align: center; white-space: nowrap; }
        .nutrition-table .col-vd { width: 20%; text-align: center; white-space: nowrap; }
        
        .nutrition-table td {
          padding: 4px 0;
          border-bottom: 1px solid black;
          font-size: 0.85em;
          vertical-align: bottom;
        }
        .nutrition-table tr:last-child td {
          border-bottom: 3px solid black;
        }
        .indent td:first-child {
          padding-left: 12px;
        }
        .label-footer {
          font-size: 0.75em;
          margin-top: 6px;
        }
        .ingredients-section {
          font-size: 0.9em;
          line-height: 1.5;
          margin-top: 12px;
        }
        .allergen-alert {
          margin-top: 4px;
          font-size: 1.1em;
        }
        .mt-1 { margin-top: 0.5rem; }
      `}} />
    </div>
  );
};

export default NutritionalLabel;
