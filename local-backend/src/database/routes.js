const express = require('express');
const { query, transaction } = require('./client');
const { authenticateToken, requireAuthenticated } = require('../auth/middleware');

const router = express.Router();

// Apply authentication middleware to all database routes
router.use(authenticateToken);

// Main database operation handler
router.post('/', async (req, res) => {
  console.log('Database POST request received:', req.body);
  try {
    const { table, operation, select = '*', where = [], data, options, orderBy, limit, range, single, maybeSingle } = req.body;
    
    if (!table || !operation) {
      return res.status(400).json({
        error: { message: 'Table and operation are required' }
      });
    }
    
    let sql = '';
    let params = [];
    let paramIndex = 1;
    
    switch (operation) {
      case 'select':
        sql = `SELECT ${select} FROM public.${table}`;
        break;
        
      case 'insert':
        if (!data) {
          return res.status(400).json({
            error: { message: 'Data is required for insert operation' }
          });
        }
        
        // Handle array of objects for bulk insert (take first object for single insert)
        let insertObject = data;
        if (Array.isArray(data)) {
          if (data.length === 0) {
            return res.status(400).json({
              error: { message: 'Insert array cannot be empty' }
            });
          }
          insertObject = data[0]; // Use first object for single insert
        }
        
        const insertKeys = Object.keys(insertObject);
        const insertValues = Object.values(insertObject);
        
        // Debug: log the final object being inserted
        console.log('Inserting into', table, ':', insertObject);
        
        if (insertKeys.length === 0) {
          return res.status(400).json({
            error: { message: 'Data object must contain at least one property' }
          });
        }
        
        const insertPlaceholders = insertValues.map(() => `$${paramIndex++}`).join(', ');
        
        sql = `INSERT INTO public.${table} (${insertKeys.join(', ')}) VALUES (${insertPlaceholders}) RETURNING *`;
        params = insertValues;
        break;
        
      case 'update':
        if (!data) {
          return res.status(400).json({
            error: { message: 'Data is required for update operation' }
          });
        }
        
        const updatePairs = Object.keys(data).map(key => {
          params.push(data[key]);
          return `${key} = $${paramIndex++}`;
        });
        
        sql = `UPDATE public.${table} SET ${updatePairs.join(', ')}`;
        break;
        
      case 'upsert':
        if (!data) {
          return res.status(400).json({
            error: { message: 'Data is required for upsert operation' }
          });
        }
        
        const upsertKeys = Object.keys(data);
        const upsertValues = Object.values(data);
        const upsertPlaceholders = upsertValues.map(() => `$${paramIndex++}`).join(', ');
        const conflictColumn = options?.onConflict || 'id';
        
        const updateClause = upsertKeys
          .filter(key => key !== conflictColumn)
          .map(key => `${key} = EXCLUDED.${key}`)
          .join(', ');
        
        sql = `INSERT INTO public.${table} (${upsertKeys.join(', ')}) VALUES (${upsertPlaceholders}) 
               ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateClause}
               RETURNING *`;
        params = upsertValues;
        break;
        
      case 'delete':
        sql = `DELETE FROM public.${table}`;
        break;
        
      default:
        return res.status(400).json({
          error: { message: 'Invalid operation' }
        });
    }
    
    // Add WHERE conditions
    if (where && where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    // Add ORDER BY
    if (orderBy) {
      sql += ` ${orderBy}`;
    }
    
    // Add LIMIT
    if (limit && limit > 0) {
      sql += ` LIMIT ${limit}`;
    }
    
    // Add RANGE (OFFSET/LIMIT)
    if (range && range.from !== undefined && range.to !== undefined) {
      const rangeLimit = range.to - range.from + 1;
      sql += ` LIMIT ${rangeLimit} OFFSET ${range.from}`;
    }
    
    // Execute query
    console.log('Executing SQL:', sql, 'with params:', params);
    const result = await query(sql, params);
    
    // Handle single/maybeSingle
    if (single || maybeSingle) {
      if (result.rows.length === 0) {
        if (single) {
          return res.status(404).json({
            error: { message: 'No rows found' }
          });
        }
        return res.json({ data: null, error: null });
      }
      
      if (result.rows.length > 1 && single) {
        return res.status(400).json({
          error: { message: 'Multiple rows found, expected single row' }
        });
      }
      
      return res.json({ 
        data: result.rows[0], 
        error: null,
        count: 1
      });
    }
    
    res.json({ 
      data: result.rows, 
      error: null,
      count: result.rowCount || result.rows.length
    });
    
  } catch (error) {
    console.error('Database operation error:', error);
    res.status(500).json({
      error: { 
        message: error.message || 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

module.exports = router;