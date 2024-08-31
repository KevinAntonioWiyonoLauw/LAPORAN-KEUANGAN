const mysql = require('mysql');
const connection = require('./db'); // Koneksi database

const updateMonthlyData = () => {
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

	// Query untuk memindahkan data tabungan bulanan
	const moveSavingsQuery = `
        INSERT INTO monthly_savings (month, year, amount)
        SELECT MONTH(date) AS month, YEAR(date) AS year, SUM(amount) AS amount
        FROM savings
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY MONTH(date), YEAR(date)
    `;

	// Query untuk menghapus data tabungan bulan ini
	const resetSavingsQuery = 'DELETE FROM savings WHERE MONTH(date) = ? AND YEAR(date) = ?';

	// Memindahkan data pengeluaran
	connection.query(moveExpensesQuery, [month, year], (err) => {
		if (err) {
			console.error('Error moving expenses data:', err);
			return;
		}

		// Menghapus data pengeluaran bulan ini
		connection.query(resetExpensesQuery, [month, year], (err) => {
			if (err) {
				console.error('Error resetting expenses data:', err);
				return;
			}

			// Memindahkan data tabungan
			connection.query(moveSavingsQuery, [month, year], (err) => {
				if (err) {
					console.error('Error moving savings data:', err);
					return;
				}

				// Menghapus data tabungan bulan ini
				connection.query(resetSavingsQuery, [month, year], (err) => {
					if (err) {
						console.error('Error resetting savings data:', err);
					} else {
						console.log('Monthly data updated successfully.');
					}
				});
			});
		});
	});
};

// Jalankan fungsi
updateMonthlyData();