CREATE TABLE monthly_income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    month INT,
    year INT,
    total_income DECIMAL(15, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
