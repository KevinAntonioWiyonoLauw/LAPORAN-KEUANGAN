// app.js
const fs = require('fs');
const express = require('express');
const app = express();
const connection = require('./db'); // Mengimpor koneksi MySQL
const path = require('path'); // Tambahkan ini
const cron = require('node-cron');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const bcrypt = require('bcrypt'); // Untuk enkripsi password
const session = require('express-session'); // Untuk menangani sesi
const saltRounds = 10; // Jumlah putaran untuk enkripsi password

// Middleware untuk menangani sesi
app.use(session({
    secret: 'Session123', // Ganti dengan kunci rahasia yang kuat
    resave: false,
    saveUninitialized: true
}));

// Rute untuk menampilkan halaman pendaftaran
// app.get('/register', (req, res) => {
//     res.render('register');
// });

// Rute untuk menangani pendaftaran
// app.post('/register', (req, res) => {
//     const { username, password } = req.body;

//     // Hash password menggunakan bcrypt
//     bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
//         if (err) {
//             console.error('Error hashing password:', err);
//             res.status(500).send('Error hashing password');
//             return;
//         }

//         // Query untuk menambahkan pengguna baru ke database
//         const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
//         connection.query(query, [username, hashedPassword], (err, results) => {
//             if (err) {
//                 console.error('Error inserting user data:', err);
//                 res.status(500).send('Error inserting user data');
//                 return;
//             }
//             res.redirect('/login');
//         });
//     });
// });

app.get('/download-report', (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).send('Month and Year are required.');
    }

    const formattedMonth = month.padStart(2, '0');
    const fileName = `financial_report_${year}_${formattedMonth}.csv`;
    const filePath = path.join(__dirname, fileName);

    const queries = {
        expenses: 'SELECT * FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?',
        income: 'SELECT * FROM income WHERE MONTH(date) = ? AND YEAR(date) = ?',
        savings: 'SELECT * FROM savings WHERE MONTH(date) = ? AND YEAR(date) = ?',
        monthly_savings: 'SELECT * FROM monthly_savings WHERE month = ? AND year = ?'
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
        connection.query(query, [month, year], (err, results) => {
            if (err) {
                console.error(`Error fetching ${tableName} data:`, err);
                return res.status(500).send('Error fetching data');
            }

            if (results.length > 0) {
                const headers = Object.keys(results[0]).map(key => ({ id: key, title: key }));
                allData.push({ headers, data: results });
                callback();
            } else {
                callback();
            }
        });
    };

    processTable('Expenses', queries.expenses, () => {
        processTable('Income', queries.income, () => {
            processTable('Savings', queries.savings, () => {
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

// Fungsi untuk memindahkan dan mereset data pengeluaran
const updateMonthlyExpenses = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const moveExpensesQuery = `
        INSERT INTO monthly_expenses (month, year, amount)
        SELECT MONTH(date) AS month, YEAR(date) AS year, SUM(amount) AS amount
        FROM expenses
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY MONTH(date), YEAR(date)
    `;

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



// Fungsi untuk memindahkan dan mereset data tabungan
const updateMonthlyData = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const moveSavingsQuery = `
        INSERT INTO monthly_savings (month, year, amount)
        SELECT MONTH(date) AS month, YEAR(date) AS year, SUM(amount) AS amount
        FROM savings
        WHERE MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY MONTH(date), YEAR(date)
    `;

    const resetSavingsQuery = 'DELETE FROM savings WHERE MONTH(date) = ? AND YEAR(date) = ?';

    connection.query(moveSavingsQuery, [month, year], (err) => {
        if (err) {
            console.error('Error moving savings data:', err);
            return;
        }

        connection.query(resetSavingsQuery, [month, year], (err) => {
            if (err) {
                console.error('Error resetting savings data:', err);
            } else {
                console.log('Monthly savings data updated successfully.');
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
    const { username, password } = req.body;

    // Query untuk mengambil data pengguna dari database
    const query = 'SELECT * FROM users WHERE username = ?';
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            res.status(500).send('Error fetching user data');
            return;
        }

        // Periksa apakah pengguna ada
        if (results.length > 0) {
            const user = results[0];

            // Periksa password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    res.status(500).send('Error comparing passwords');
                    return;
                }

                if (isMatch) {
                    req.session.user = user; // Simpan data pengguna di sesi
                    res.redirect('/'); // Redirect ke halaman utama setelah login berhasil
                } else {
                    res.status(401).send('Invalid credentials');
                }
            });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Middleware untuk memeriksa apakah pengguna sudah login
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Rute untuk menampilkan halaman utama
app.get('/', isAuthenticated, (req, res) => {
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

// Rute untuk menambahkan pemasukan
app.post('/income', isAuthenticated, (req, res) => {
    const { amount, date, description } = req.body;

    const query = 'INSERT INTO income (amount, date, description) VALUES (?, ?, ?)';
    connection.query(query, [amount, date, description], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
            return;
        }
        res.redirect('/');
    });
});

// Rute untuk menambahkan pengeluaran
app.post('/expenses', isAuthenticated, (req, res) => {
    const { amount, date, description, category } = req.body;

    const query = 'INSERT INTO expenses (amount, date, description, category) VALUES (?, ?, ?, ?)';
    connection.query(query, [amount, date, description, category], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
            return;
        }
        res.redirect('/');
    });
});

// Rute untuk menambahkan tabungan
app.post('/savings', isAuthenticated, (req, res) => {
    const { amount, date, description } = req.body;

    const query = 'INSERT INTO savings (amount, date, description) VALUES (?, ?, ?)';
    connection.query(query, [amount, date, description], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
            return;
        }
        res.redirect('/'); // Redirect to home page after adding
    });
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

// Menjadwalkan tugas untuk menjalankan updateMonthlyData pada awal bulan
cron.schedule('0 0 1 * *', () => {
    updateMonthlyData();
});



// Rute untuk logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
            return;
        }
        res.redirect('/login');
    });
});

// Menjalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
