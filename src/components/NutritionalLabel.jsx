import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const NutritionalLabel = ({ 
  data = {}, 
  ingredients = [], 
  config = {},
  lote = '',
  validade = '',
  title = '',
  portionSize = 25,
  portionDescription = ''
}) => {
  const {
    showTitle = false,
    showLogo = false,
    logoUrl = '',
    showQR = false,
    qrType = 'site',
    qrValue = '',
    showLote = false,
    showValidade = false,
    fontSize = 0.75,
    width = 50.8,
    height = 101.6,
    showIngredients = true
  } = (config || {});

  const defaultData = {
    kcal: 0, carb: 0, sugarTotal: 0, sugarAdded: 0,
    protein: 0, fatTotal: 0, fatSat: 0, fatTrans: 0,
    fiber: 0, sodium: 0
  };

  const d = { ...defaultData, ...(data || {}) };
  
  // Calculate portion values (based on d which is 100g)
  const factor = portionSize / 100;
  const p = {
    kcal: (d.kcal * factor).toFixed(0),
    kj: (d.kcal * 4.2 * factor).toFixed(0),
    carb: (d.carb * factor).toFixed(1),
    sugarTotal: (d.sugarTotal * factor).toFixed(1),
    sugarAdded: (d.sugarAdded * factor).toFixed(1),
    protein: (d.protein * factor).toFixed(1),
    fatTotal: (d.fatTotal * factor).toFixed(1),
    fatSat: (d.fatSat * factor).toFixed(1),
    fatTrans: (d.fatTrans * factor).toFixed(1),
    fiber: (d.fiber * factor).toFixed(1),
    sodium: (d.sodium * factor).toFixed(0),
    kj100g: (d.kcal * 4.2).toFixed(0)
  };

  // Sort ingredients by percentage descending
  const sortedIngredients = [...ingredients].sort((a, b) => b.perc - a.perc);
  const ingredientsString = sortedIngredients.map(i => i.nome).join(', ');

  const getVD = (val, ref) => {
    const vd = Math.round((val / ref) * 100);
    return vd > 0 ? `${vd}%` : '0%';
  };

  return (
    <div 
      className="nutritional-label-container" 
      style={{ 
        width: `${width}mm`, 
        height: height ? `${height}mm` : 'auto',
        fontSize: `${fontSize}rem`,
        overflow: 'hidden'
      }}
    >
      {showLogo && config.logoUrl && (
        <div className="label-logo-container">
          <img src={config.logoUrl} alt="Logo" className="label-logo" />
        </div>
      )}

      {showTitle && title && (
        <div className="label-custom-title">{title}</div>
      )}

      <div className="nutritional-label">
        <div className="label-header">INFORMAÇÃO NUTRICIONAL</div>
        <div className="label-subheader">Porções por embalagem: Variável</div>
        <div className="label-subheader">Porção: {portionSize}g {portionDescription ? `(${portionDescription})` : ''}</div>
        
        <table className="nutrition-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}></th>
              <th>100g</th>
              <th>{portionSize}g</th>
              <th>%VD*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Valor energético (kcal)</td>
              <td>{d.kcal}</td>
              <td>{p.kcal}</td>
              <td>{getVD(p.kcal, 2000)}</td>
            </tr>
            <tr>
              <td>Valor energético (kJ)</td>
              <td>{p.kj100g}</td>
              <td>{p.kj}</td>
              <td>{getVD(p.kcal, 2000)}</td>
            </tr>
            <tr>
              <td>Carboidratos (g)</td>
              <td>{d.carb}</td>
              <td>{p.carb}</td>
              <td>{getVD(p.carb, 300)}</td>
            </tr>
            <tr className="indent">
              <td>Açúcares totais (g)</td>
              <td>{d.sugarTotal}</td>
              <td>{p.sugarTotal}</td>
              <td>-</td>
            </tr>
            <tr className="indent">
              <td>Açúcares adicionados (g)</td>
              <td>{d.sugarAdded}</td>
              <td>{p.sugarAdded}</td>
              <td>{getVD(p.sugarAdded, 50)}</td>
            </tr>
            <tr>
              <td>Proteínas (g)</td>
              <td>{d.protein}</td>
              <td>{p.protein}</td>
              <td>{getVD(p.protein, 50)}</td>
            </tr>
            <tr>
              <td>Gorduras totais (g)</td>
              <td>{d.fatTotal}</td>
              <td>{p.fatTotal}</td>
              <td>{getVD(p.fatTotal, 55)}</td>
            </tr>
            <tr className="indent">
              <td>Gorduras saturadas (g)</td>
              <td>{d.fatSat}</td>
              <td>{p.fatSat}</td>
              <td>{getVD(p.fatSat, 22)}</td>
            </tr>
            <tr className="indent">
              <td>Gorduras trans (g)</td>
              <td>{d.fatTrans}</td>
              <td>{p.fatTrans}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Fibras alimentares (g)</td>
              <td>{d.fiber}</td>
              <td>{p.fiber}</td>
              <td>{getVD(p.fiber, 25)}</td>
            </tr>
            <tr>
              <td>Sódio (mg)</td>
              <td>{d.sodium}</td>
              <td>{p.sodium}</td>
              <td>{getVD(p.sodium, 2000)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="label-footer">
          * Percentual de valores diários fornecidos pela porção.
        </div>

        {showIngredients && ingredients.length > 0 && (
          <div className="ingredients-section mt-1">
            <strong>Ingredientes:</strong> {ingredientsString}.
          </div>
        )}
      </div>

      <div className="label-extra-info">
        <div className="flex justify-between items-end gap-2">
          <div className="flex-column gap-1">
            {showLote && lote && (
              <div className="extra-field"><strong>LOTE:</strong> {lote}</div>
            )}
            {showValidade && validade && (
              <div className="extra-field"><strong>VAL:</strong> {validade}</div>
            )}
          </div>
          
          {showQR && qrValue && (
            <div className="qr-container">
              <QRCodeSVG value={qrValue} size={48} />
              <div style={{ fontSize: '0.5rem', textAlign: 'center', marginTop: '2px' }}>
                {qrType === 'instagram' ? '@insta' : 'website'}
              </div>
            </div>
          )}
        </div>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        .nutritional-label-container {
          background: white;
          color: black;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }
        .label-custom-title {
          font-weight: 800;
          text-align: center;
          margin-bottom: 4px;
          text-transform: uppercase;
          border-bottom: 1px solid black;
        }
        .label-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }
        .label-logo {
          max-height: 50px;
          max-width: 100%;
          object-fit: contain;
        }
        .nutritional-label {
          border: 1px solid black;
          padding: 6px;
        }
        .label-header {
          font-weight: 900;
          font-size: 1.1em;
          border-bottom: 3px solid black;
          padding-bottom: 1px;
          margin-bottom: 2px;
        }
        .label-subheader {
          font-weight: 600;
          border-bottom: 1px solid black;
          padding: 1px 0;
          font-size: 0.9em;
        }
        .nutrition-table {
          width: 100%;
          border-collapse: collapse;
        }
        .nutrition-table th {
          text-align: right;
          border-bottom: 1px solid black;
          font-size: 0.85em;
        }
        .nutrition-table td {
          padding: 1px 0;
          border-bottom: 1px solid #eee;
          line-height: 1.1;
        }
        .indent td:first-child {
          padding-left: 8px;
        }
        .label-footer {
          font-size: 0.8em;
          margin-top: 4px;
        }
        .ingredients-section {
          font-size: 0.85em;
          line-height: 1.2;
          margin-top: 4px;
          border-top: 1px solid black;
          padding-top: 2px;
        }
        .label-extra-info {
          margin-top: 4px;
          padding: 4px;
          border: 1px dashed #ccc;
        }
        .extra-field {
          font-size: 0.9em;
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mt-1 { margin-top: 0.25rem; }
        .flex { display: flex; }
        .flex-column { display: flex; flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .items-end { align-items: flex-end; }
        .gap-1 { gap: 4px; }
        .gap-2 { gap: 8px; }
      `}} />
    </div>
  );
};

export default NutritionalLabel;
