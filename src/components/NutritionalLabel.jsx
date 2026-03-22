import React from 'react';

const NutritionalLabel = ({ data, ingredients = [] }) => {
  // Example data structure:
  // { kcal: 540, carb: 45, sugarTotal: 40, sugarAdded: 38, protein: 6, fatTotal: 38, fatSat: 22, fatTrans: 0, fiber: 8, sodium: 15 }
  
  const defaultData = {
    kcal: 0, carb: 0, sugarTotal: 0, sugarAdded: 0,
    protein: 0, fatTotal: 0, fatSat: 0, fatTrans: 0,
    fiber: 0, sodium: 0
  };

  const d = { ...defaultData, ...data };

  // Sort ingredients by percentage descending
  const sortedIngredients = [...ingredients].sort((a, b) => b.perc - a.perc);
  const ingredientsString = sortedIngredients.map(i => i.nome).join(', ');

  return (
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

      {ingredients.length > 0 && (
        <div className="ingredients-section mt-2">
          <strong>Ingredientes:</strong> {ingredientsString}.
        </div>
      )}


      <style dangerouslySetInnerHTML={{ __html: `
        .nutritional-label {
          background: white;
          border: 1px solid black;
          padding: 8px;
          width: 300px;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          color: black;
        }
        .label-header {
          font-weight: 900;
          font-size: 1.1rem;
          border-bottom: 4px solid black;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .label-subheader {
          font-weight: 500;
          border-bottom: 1px solid black;
          padding: 2px 0;
        }
        .nutrition-table {
          width: 100%;
          border-collapse: collapse;
        }
        .nutrition-table th {
          text-align: right;
          border-bottom: 1px solid black;
        }
        .nutrition-table td {
          padding: 2px 0;
          border-bottom: 1px solid #ddd;
        }
        .indent td:first-child {
          padding-left: 12px;
        }
        .label-footer {
          font-size: 0.65rem;
          margin-top: 8px;
        }
      `}} />
    </div>
  );
};

export default NutritionalLabel;
