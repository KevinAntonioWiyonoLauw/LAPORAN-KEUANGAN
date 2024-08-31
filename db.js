// db.js
const mysql = require('mysql');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root', // Sesuaikan dengan username MySQL kamu
	password: '', // Sesuaikan dengan password MySQL kamu
	database: 'financial_management' // Nama database yang sudah kamu buat
});

connection.connect((err) => {
	if (err) {
		console.error('Error connecting to MySQL:', err);
		return;
	}
	console.log('Connected to MySQL!');
});

module.exports = connection;