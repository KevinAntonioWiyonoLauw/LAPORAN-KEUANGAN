// updateMonthlyExpenses.js
const mysql = require('mysql');
const connection = require('./db'); // Koneksi database

const updateMonthlyExpenses = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-based month
    const year = now.getFullYear();

    // Query untuk memindahkan data pengeluaran bulanan
    const moveExpensesQuery = `
        INSERT INTO monthly_expenses (month, year, amount)
        SELECT MONTH(date) AS month, YEAR(date) AS year, SUM(amount) AS amount
        FROM expenses
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY MONTH(date), YEAR(date)
    `;

    // Query untuk menghapus data pengeluaran bulan ini
    const resetExpensesQuery = 'DELETE FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?';

    connection.query(moveExpensesQuery, [month, year], (err) => {
        if (err) {
            console.error('Error moving expenses data:', err);
            return;
        }

        connection.query(resetExpensesQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting expenses data:', err);
            } else {
                console.log('Monthly expenses data updated successfully.');
            }
        });
    });
};

updateMonthlyExpenses();
