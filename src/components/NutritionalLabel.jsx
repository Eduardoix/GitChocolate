import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const NutritionalLabel = ({ 
  data = {}, 
  ingredients = [], 
  config = {},
  lote = '',
  validade = '',
  title = ''
}) => {
  console.log('NutritionalLabel rendering with:', { data, config });
  const {
    showTitle = false,
    showQR = false,
    qrType = 'site',
    qrValue = '',
    showLote = false,
    showValidade = false,
    fontSize = 0.75,
    width = 300,
    showIngredients = true
  } = config;

  const defaultData = {
    kcal: 0, carb: 0, sugarTotal: 0, sugarAdded: 0,
    protein: 0, fatTotal: 0, fatSat: 0, fatTrans: 0,
    fiber: 0, sodium: 0
  };

  const d = { ...defaultData, ...(data || {}) };

  // Sort ingredients by percentage descending
  const sortedIngredients = [...ingredients].sort((a, b) => b.perc - a.perc);
  const ingredientsString = sortedIngredients.map(i => i.nome).join(', ');

  return (
    <div className="nutritional-label-container" style={{ width: `${width}px`, fontSize: `${fontSize}rem` }}>
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
        <div className="label-subheader">Porção: 100g</div>
        
        <table className="nutrition-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}></th>
              <th>100g</th>
              <th>%VD*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Valor energético (kcal)</td>
              <td>{d.kcal}</td>
              <td>{Math.round(d.kcal / 2000 * 100)}%</td>
            </tr>
            <tr>
              <td>Carboidratos (g)</td>
              <td>{d.carb}</td>
              <td>{Math.round(d.carb / 300 * 100)}%</td>
            </tr>
            <tr className="indent">
              <td>Açúcares totais (g)</td>
              <td>{d.sugarTotal}</td>
              <td>-</td>
            </tr>
            <tr className="indent">
              <td>Açúcares adicionados (g)</td>
              <td>{d.sugarAdded}</td>
              <td>{Math.round(d.sugarAdded / 50 * 100)}%</td>
            </tr>
            <tr>
              <td>Proteínas (g)</td>
              <td>{d.protein}</td>
              <td>{Math.round(d.protein / 50 * 100)}%</td>
            </tr>
            <tr>
              <td>Gorduras totais (g)</td>
              <td>{d.fatTotal}</td>
              <td>{Math.round(d.fatTotal / 55 * 100)}%</td>
            </tr>
            <tr className="indent">
              <td>Gorduras saturadas (g)</td>
              <td>{d.fatSat}</td>
              <td>{Math.round(d.fatSat / 22 * 100)}%</td>
            </tr>
            <tr className="indent">
              <td>Gorduras trans (g)</td>
              <td>{d.fatTrans}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Fibras alimentares (g)</td>
              <td>{d.fiber}</td>
              <td>{Math.round(d.fiber / 25 * 100)}%</td>
            </tr>
            <tr>
              <td>Sódio (mg)</td>
              <td>{d.sodium}</td>
              <td>{Math.round(d.sodium / 2000 * 100)}%</td>
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
