// app.js
const fs = require('fs');
const express = require('express');
const app = express();
const connection = require('./db'); // Mengimpor koneksi MySQL
const path = require('path'); // Tambahkan ini
const cron = require('node-cron');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

app.use(express.urlencoded({
	extended: true
}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const bcrypt = require('bcrypt'); // Untuk enkripsi password
const session = require('express-session'); // Untuk menangani sesi
const saltRounds = 10; // Jumlah putaran untuk enkripsi password

// Middleware untuk menangani sesi
app.use(session({
	secret: process.env.SECRET_KEY, // Ganti dengan secret yang lebih kuat
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false
	} // Jika kamu menggunakan HTTP biasa (non-HTTPS)
}));


// Rute untuk menampilkan halaman pendaftaran
app.get('/register', (req, res) => {
	res.render('register');
});

// Rute untuk menangani pendaftaran
app.post('/register', (req, res) => {
	const {
		username,
		password
	} = req.body;

	// Cek apakah username sudah ada
	const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
	connection.query(checkUserQuery, [username], (err, results) => {
		if (err) {
			console.error('Error checking username:', err);
			return res.status(500).send('Error checking username');
		}

		if (results.length > 0) {
			// Username sudah ada
			return res.status(400).send('Username already exists');
		}

		// Hash password sebelum disimpan ke database
		bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
			if (err) {
				console.error('Error hashing password:', err);
				return res.status(500).send('Error hashing password');
			}

			// Simpan user baru ke database
			const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
			connection.query(insertUserQuery, [username, hashedPassword], (err) => {
				if (err) {
					console.error('Error inserting user data:', err);
					return res.status(500).send('Error inserting user data');
				}

				res.redirect('/login'); // Redirect ke halaman login setelah registrasi berhasil
			});
		});
	});
});

app.get('/download-report', isAuthenticated, (req, res) => {
	const {
		month,
		year
	} = req.query;
	const userId = req.session.userId; // Ambil user ID dari sesi

	if (!month || !year) {
		return res.status(400).send('Month and Year are required.');
	}

	const formattedMonth = month.padStart(2, '0');
	const fileName = `financial_report_${year}_${formattedMonth}.csv`;
	const filePath = path.join(__dirname, fileName);

	const queries = {
		expenses: 'SELECT amount, date, description, category FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ? AND user_id = ?',
		income: 'SELECT amount, date, description FROM income WHERE MONTH(date) = ? AND YEAR(date) = ? AND user_id = ?',
		savings: 'SELECT amount, date, description FROM savings WHERE MONTH(date) = ? AND YEAR(date) = ? AND user_id = ?',
		monthly_expenses: 'SELECT amount FROM monthly_expenses WHERE month = ? AND year = ? AND user_id = ?',
		monthly_savings: 'SELECT amount FROM monthly_savings WHERE month = ? AND year = ? AND user_id = ?',
	};

	const allData = [];

	const writeCsv = (header, data, callback) => {
		const csvWriter = createCsvWriter({
			path: filePath,
			header: header,
			append: true
		});

		csvWriter.writeRecords(data)
			.then(() => {
				console.log(`Data written to ${filePath}`);
				callback();
			})
			.catch(err => {
				console.error('Error writing CSV:', err);
				res.status(500).send('Error generating report');
			});
	};

	const processTable = (tableName, query, callback) => {
		connection.query(query, [month, year, userId], (err, results) => {
			if (err) {
				console.error(`Error fetching ${tableName} data:`, err);
				return res.status(500).send('Error fetching data');
			}

			if (results.length > 0) {
				const headers = Object.keys(results[0]).map(key => ({
					id: key,
					title: key
				}));
				allData.push({
					headers,
					data: results
				});
				callback();
			} else {
				callback();
			}
		});
	};

	processTable('Expenses', queries.expenses, () => {
		processTable('Income', queries.income, () => {
			processTable('Savings', queries.savings, () => {
				processTable('Monthly Expenses', queries.monthly_expenses, () => {
					processTable('Monthly Savings', queries.monthly_savings, () => {
						fs.writeFile(filePath, allData.map(item => {
							return item.headers.map(header => header.title).join(',') + '\n' +
								item.data.map(row => item.headers.map(header => row[header.id]).join(',')).join('\n');
						}).join('\n'), (err) => {
							if (err) {
								console.error('Error writing file:', err);
								return res.status(500).send('Error generating report');
							}

							res.download(filePath, () => {
								fs.unlink(filePath, (err) => {
									if (err) {
										console.error('Error deleting file:', err);
									}
								});
							});
						});
					});
				});
			});
		});
	});
});



// Fungsi untuk memindahkan dan mereset data pengeluaran
const updateMonthlyExpenses = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const moveExpensesQuery = `
        INSERT INTO monthly_expenses (user_id, month, year, amount)
        SELECT user_id, MONTH(date), YEAR(date), SUM(amount)
        FROM expenses
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY user_id, MONTH(date), YEAR(date)
    `;

    connection.query(moveExpensesQuery, [month, year], (err, results) => {
        if (err) {
            console.error('Error moving expenses data:', err);
            return;
        }
        console.log('Expenses data moved to monthly_expenses:', results); // Log hasil insert

        // Jalankan penghapusan setelah data berhasil dipindahkan
        const resetExpensesQuery = 'DELETE FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?';
        connection.query(resetExpensesQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting expenses data:', err);
            } else {
                console.log('Expenses data reset successfully.');
            }
        });
    });
};




const updateMonthlyIncome = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const moveIncomeQuery = `
        INSERT INTO monthly_income (user_id, month, year, total_income)
        SELECT user_id, MONTH(date), YEAR(date), SUM(amount)
        FROM income
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY user_id
    `;

    console.log(`Executing moveIncomeQuery for month: ${month}, year: ${year}`); // Log untuk debugging

    connection.query(moveIncomeQuery, [month, year], (err, results) => {
        if (err) {
            console.error('Error moving income data:', err);
            return;
        }

        console.log('Income data moved:', results); // Log hasil query moveIncomeQuery

        connection.query('SELECT * FROM monthly_income WHERE month = ? AND year = ?', [month, year], (err, results) => {
            if (err) {
                console.error('Error fetching moved income data:', err);
            } else {
                console.log('Moved income data:', results); // Log data yang berhasil dipindahkan
            }
        });

        const resetIncomeQuery = 'DELETE FROM income WHERE MONTH(date) = ? AND YEAR(date) = ?';
        console.log('Executing resetIncomeQuery'); // Log sebelum reset income

        connection.query(resetIncomeQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting income data:', err);
            } else {
                console.log('Income data reset successfully.'); // Log setelah reset berhasil
            }
        });
    });
};


const updateMonthlyData = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const moveIncomeQuery = `
        INSERT INTO monthly_income (user_id, month, year, total_income)
        SELECT user_id, ?, ?, SUM(amount)
        FROM income
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY user_id
    `;

    connection.query(moveIncomeQuery, [month, year, month, year], (err, results) => {
        if (err) {
            console.error('Error inserting income data:', err);
            return;
        }
        console.log('Income data moved to monthly_income:', results); // Log hasil insert

        // Jalankan penghapusan setelah data berhasil dipindahkan
        const resetIncomeQuery = 'DELETE FROM income WHERE MONTH(date) = ? AND YEAR(date) = ?';
        connection.query(resetIncomeQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting income data:', err);
            } else {
                console.log('Income data reset successfully.');
            }
        });
    });

    const moveExpensesQuery = `
        INSERT INTO monthly_expenses (month, year, total_expenses)
        SELECT MONTH(date), YEAR(date), SUM(amount)
        FROM expenses
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY MONTH(date), YEAR(date)
    `;

    connection.query(moveExpensesQuery, [month, year], (err, results) => {
        if (err) {
            console.error('Error inserting expenses data:', err);
            return;
        }
        console.log('Expenses data moved to monthly_expenses:', results); // Log hasil insert

        // Jalankan penghapusan setelah data berhasil dipindahkan
        const resetExpensesQuery = 'DELETE FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?';
        connection.query(resetExpensesQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting expenses data:', err);
            } else {
                console.log('Expenses data reset successfully.');
            }
        });
    });
};


// Rute untuk menampilkan halaman login
app.get('/login', (req, res) => {
	res.render('login');
});

// Rute untuk menangani login
app.post('/login', (req, res) => {
	const {
		username,
		password
	} = req.body;

	const query = 'SELECT * FROM users WHERE username = ?';
	connection.query(query, [username], (err, results) => {
		if (err) {
			console.error('Error fetching user data:', err);
			return res.status(500).send('Error fetching user data');
		}

		if (results.length > 0) {
			const user = results[0];

			bcrypt.compare(password, user.password, (err, isMatch) => {
				if (err) {
					console.error('Error comparing passwords:', err);
					return res.status(500).send('Error comparing passwords');
				}

				if (isMatch) {
					req.session.userId = user.id; // Simpan user ID di sesi
					console.log('User ID saved in session:', req.session.userId); // Debugging: cek apakah sesi tersimpan
					res.redirect('/'); // Redirect ke halaman utama
					console.log('Login successful. Redirecting to index...');
				} else {
					res.status(401).send('Invalid username or password');
				}
			});
		} else {
			res.status(401).send('Invalid username or password');
		}
	});
});

// Middleware untuk memeriksa apakah pengguna sudah login
function isAuthenticated(req, res, next) {
	if (req.session && req.session.userId) {
		console.log('Checking authentication...');
		console.log('Session User ID:', req.session.userId);
		return next();
	}
	res.redirect('/login');
}


// Rute untuk menampilkan halaman utama
app.get('/', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    const monthlyBalanceQuery = 'SELECT SUM(balance) AS total_balance FROM monthly_balance WHERE user_id = ?';
    const currentIncomeQuery = 'SELECT SUM(amount) AS total_income FROM income WHERE user_id = ?';
    const currentExpensesQuery = 'SELECT SUM(amount) AS total_expenses FROM expenses WHERE user_id = ?';
    const savingsQuery = 'SELECT SUM(amount) AS total_savings FROM savings WHERE user_id = ?';

    connection.query(monthlyBalanceQuery, [userId], (err, balanceResults) => {
        if (err) {
            console.error('Error fetching balance data:', err);
            return res.status(500).send('Error fetching balance data');
        }

        connection.query(currentIncomeQuery, [userId], (err, incomeResults) => {
            if (err) {
                console.error('Error fetching income data:', err);
                return res.status(500).send('Error fetching income data');
            }

            connection.query(currentExpensesQuery, [userId], (err, expensesResults) => {
                if (err) {
                    console.error('Error fetching expenses data:', err);
                    return res.status(500).send('Error fetching expenses data');
                }

                connection.query(savingsQuery, [userId], (err, savingsResults) => {
                    if (err) {
                        console.error('Error fetching savings data:', err);
                        return res.status(500).send('Error fetching savings data');
                    }

                    const previousBalance = balanceResults[0].total_balance || 0;
                    const totalIncome = incomeResults[0].total_income || 0;
                    const totalExpenses = expensesResults[0].total_expenses || 0;
                    const totalSavings = savingsResults[0].total_savings || 0;
                    const balance = previousBalance + (totalIncome - totalExpenses - totalSavings);

                    res.render('index', {
                        totalIncome,
                        totalExpenses,
                        totalSavings,
                        balance
                    });
                });
            });
        });
    });
});



// Rute untuk menambahkan pemasukan
app.post('/income', isAuthenticated, (req, res) => {
	const {
		amount,
		date,
		description
	} = req.body;
	const userId = req.session.userId; // Dapatkan user ID dari sesi

	const query = 'INSERT INTO income (amount, date, description, user_id) VALUES (?, ?, ?, ?)';
	connection.query(query, [amount, date, description, userId], (err, results) => {
		if (err) {
			console.error('Error inserting income:', err);
			return res.status(500).send('Error inserting income');
		}
		res.redirect('/'); // Redirect ke halaman utama setelah menambah income
	});
});



// Rute untuk menambahkan pengeluaran
app.post('/expenses', isAuthenticated, (req, res) => {
	const {
		amount,
		date,
		description,
		category
	} = req.body;
	const userId = req.session.userId; // Ambil user ID dari sesi

	const query = 'INSERT INTO expenses (amount, date, description, category, user_id) VALUES (?, ?, ?, ?, ?)';
	connection.query(query, [amount, date, description, category, userId], (err, results) => {
		if (err) {
			console.error('Error inserting data:', err);
			return res.status(500).send('Error inserting data');
		}
		res.redirect('/');
	});
});


// Rute untuk menambahkan tabungan
app.post('/savings', isAuthenticated, (req, res) => {
	const {
		amount,
		date,
		description
	} = req.body;
	const userId = req.session.userId; // Ambil user ID dari sesi

	const query = 'INSERT INTO savings (amount, date, description, user_id) VALUES (?, ?, ?, ?)';
	connection.query(query, [amount, date, description, userId], (err, results) => {
		if (err) {
			console.error('Error inserting data:', err);
			return res.status(500).send('Error inserting data');
		}
		res.redirect('/');
	});
});

app.get('/test-reset', (req, res) => {
    updateMonthlyData();
    res.send('Monthly reset triggered!');
});


// Rute untuk mendapatkan laporan keuangan
app.get('/report', isAuthenticated, (req, res) => {
	const incomeQuery = 'SELECT SUM(amount) AS total_income FROM income';
	const expensesQuery = 'SELECT SUM(amount) AS total_expenses FROM expenses';
	const savingsQuery = 'SELECT SUM(amount) AS total_savings FROM savings';

	connection.query(incomeQuery, (err, incomeResults) => {
		if (err) {
			console.error('Error fetching income data:', err);
			res.status(500).send('Error fetching income data');
			return;
		}

		connection.query(expensesQuery, (err, expensesResults) => {
			if (err) {
				console.error('Error fetching expenses data:', err);
				res.status(500).send('Error fetching expenses data');
				return;
			}

			connection.query(savingsQuery, (err, savingsResults) => {
				if (err) {
					console.error('Error fetching savings data:', err);
					res.status(500).send('Error fetching savings data');
					return;
				}

				const totalIncome = incomeResults[0].total_income || 0;
				const totalExpenses = expensesResults[0].total_expenses || 0;
				const totalSavings = savingsResults[0].total_savings || 0;

				const balance = totalIncome - totalExpenses - totalSavings;

				const report = {
					total_income: totalIncome,
					total_expenses: totalExpenses,
					total_savings: totalSavings,
					balance: balance
				};

				res.json(report);
			});
		});
	});
});

// Menjadwalkan tugas untuk menjalankan updateMonthlyExpenses pada awal bulan
cron.schedule('0 0 1 * *', () => {
	updateMonthlyExpenses();
});

// Menjadwalkan tugas untuk menjalankan reset bulanan pada tanggal 1 setiap bulan
cron.schedule('0 0 1 * *', () => {
    updateMonthlyData();
});



cron.schedule('0 0 1 * *', () => {
	updateMonthlyIncome();
});


// Rute untuk logout
app.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Error destroying session:', err);
			return res.status(500).send('Error logging out');
		}
		res.redirect('/login'); // Redirect ke halaman login setelah logout
	});
});



// Menjalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});