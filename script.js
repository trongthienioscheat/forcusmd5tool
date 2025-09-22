// MD5 Over/Under Ratio Predictor
// Analysis and prediction logic

class MD5Analyzer {
    constructor() {
        this.analysisHistory = JSON.parse(localStorage.getItem('md5AnalysisHistory') || '[]');
        this.statistics = {
            totalAnalyzed: 0,
            overCount: 0,
            underCount: 0,
            successRate: 0
        };
        this.loadStatistics();
        this.updateDisplay();
    }

    // Kiểm tra định dạng mã MD5
    isValidMD5(hash) {
        const md5Regex = /^[a-fA-F0-9]{32}$/;
        return md5Regex.test(hash);
    }

    // Phân tích mã MD5 và trích xuất đặc điểm
    analyzeHash(md5Hash) {
        if (!this.isValidMD5(md5Hash)) {
            throw new Error('Định dạng mã MD5 không hợp lệ');
        }

        const hash = md5Hash.toLowerCase();
        
        // Extract various numerical patterns from the hash
        const analysis = {
            hash: hash,
            timestamp: new Date().toISOString(),
            
            // Character distribution analysis
            digitCount: (hash.match(/[0-9]/g) || []).length,
            letterCount: (hash.match(/[a-f]/g) || []).length,
            
            // Numerical value analysis
            hexValue: parseInt(hash.substring(0, 8), 16),
            checksum: this.calculateChecksum(hash),
            entropy: this.calculateEntropy(hash),
            
            // Pattern analysis
            repeatingPatterns: this.findRepeatingPatterns(hash),
            sequentialCount: this.countSequentialChars(hash),
            
            // Statistical measures
            variance: this.calculateVariance(hash),
            mean: this.calculateMean(hash),
            
            // Specific position analysis
            firstByte: parseInt(hash.substring(0, 2), 16),
            lastByte: parseInt(hash.substring(30, 32), 16),
            middleByte: parseInt(hash.substring(14, 16), 16),
        };

        return analysis;
    }

    // Calculate simple checksum
    calculateChecksum(hash) {
        let sum = 0;
        for (let i = 0; i < hash.length; i++) {
            sum += hash.charCodeAt(i);
        }
        return sum;
    }

    // Calculate entropy (randomness measure)
    calculateEntropy(hash) {
        const freq = {};
        for (let char of hash) {
            freq[char] = (freq[char] || 0) + 1;
        }
        
        let entropy = 0;
        const len = hash.length;
        for (let count of Object.values(freq)) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }
        
        return entropy;
    }

    // Find repeating patterns
    findRepeatingPatterns(hash) {
        let patterns = 0;
        for (let i = 0; i < hash.length - 1; i++) {
            if (hash[i] === hash[i + 1]) {
                patterns++;
            }
        }
        return patterns;
    }

    // Count sequential characters
    countSequentialChars(hash) {
        let count = 0;
        for (let i = 0; i < hash.length - 1; i++) {
            const current = parseInt(hash[i], 16);
            const next = parseInt(hash[i + 1], 16);
            if (next === current + 1 || (current === 15 && next === 0)) {
                count++;
            }
        }
        return count;
    }

    // Calculate variance of character values
    calculateVariance(hash) {
        const values = hash.split('').map(c => parseInt(c, 16));
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    // Calculate mean of character values
    calculateMean(hash) {
        const values = hash.split('').map(c => parseInt(c, 16));
        return values.reduce((a, b) => a + b) / values.length;
    }

    // Dự đoán Trên/Dưới dựa trên phân tích
    predictOverUnder(analysis) {
        // Thuật toán dự đoán đa yếu tố
        let overScore = 0;
        let confidence = 0;
        
        // Yếu tố 1: Phân tích byte đầu (25% trọng số)
        if (analysis.firstByte > 127) {
            overScore += 25;
        }
        
        // Yếu tố 2: Phân tích entropy (20% trọng số)
        if (analysis.entropy > 3.5) {
            overScore += 20;
        }
        
        // Yếu tố 3: Tỷ lệ số/chữ (15% trọng số)
        const digitRatio = analysis.digitCount / 32;
        if (digitRatio > 0.5) {
            overScore += 15;
        }
        
        // Yếu tố 4: Phân tích phương sai (15% trọng số)
        if (analysis.variance > 20) {
            overScore += 15;
        }
        
        // Yếu tố 5: Phân tích mẫu lặp (10% trọng số)
        if (analysis.repeatingPatterns < 3) {
            overScore += 10;
        }
        
        // Yếu tố 6: Mẫu tuần tự (10% trọng số)
        if (analysis.sequentialCount < 2) {
            overScore += 10;
        }
        
        // Yếu tố 7: Byte giữa (5% trọng số)
        if (analysis.middleByte % 2 === 0) {
            overScore += 5;
        }
        
        // Tính độ tin cậy dựa trên mức độ quyết định của điểm số
        const scoreDistance = Math.abs(overScore - 50);
        confidence = Math.min(95, 50 + scoreDistance);
        
        const prediction = overScore >= 50 ? 'Xỉu' : 'Tài';
        const predictionIcon = overScore >= 50 ? '📉' : '📈';
        const predictionDescription = overScore >= 50 ? 
            'Kết quả có khả năng cao hơn mức trung bình' : 
            'Kết quả có khả năng thấp hơn mức trung bình';
        
        return {
            prediction,
            predictionIcon,
            predictionDescription,
            confidence: Math.round(confidence),
            score: overScore,
            factors: {
                firstByte: analysis.firstByte,
                entropy: Math.round(analysis.entropy * 100) / 100,
                digitRatio: Math.round(digitRatio * 100),
                variance: Math.round(analysis.variance * 100) / 100,
                patterns: analysis.repeatingPatterns,
                sequential: analysis.sequentialCount
            }
        };
    }

    // Save analysis to history
    saveToHistory(analysis, prediction) {
        const historyItem = {
            ...analysis,
            prediction: prediction.prediction,
            confidence: prediction.confidence,
            score: prediction.score
        };
        
        this.analysisHistory.unshift(historyItem);
        
        // Keep only last 100 analyses
        if (this.analysisHistory.length > 100) {
            this.analysisHistory = this.analysisHistory.slice(0, 100);
        }
        
        localStorage.setItem('md5AnalysisHistory', JSON.stringify(this.analysisHistory));
        this.updateStatistics();
    }

    // Cập nhật thống kê
    updateStatistics() {
        this.statistics.totalAnalyzed = this.analysisHistory.length;
        this.statistics.overCount = this.analysisHistory.filter(item => item.prediction === 'TRÊN').length;
        this.statistics.underCount = this.analysisHistory.filter(item => item.prediction === 'DƯỚI').length;
        
        // Tính tỷ lệ thành công (placeholder - cần kết quả thực tế để xác minh)
        this.statistics.successRate = this.analysisHistory.length > 0 ? 
            Math.round((this.statistics.overCount / this.statistics.totalAnalyzed) * 100) : 0;
    }

    // Load statistics from localStorage
    loadStatistics() {
        this.updateStatistics();
    }

    // Cập nhật hiển thị
    updateDisplay() {
        document.getElementById('totalAnalyzed').textContent = this.statistics.totalAnalyzed;
        document.getElementById('overCount').textContent = this.statistics.overCount;
        document.getElementById('underCount').textContent = this.statistics.underCount;
        document.getElementById('successRate').textContent = this.statistics.successRate + '%';
        
        this.updateHistoryDisplay();
    }

    // Cập nhật hiển thị lịch sử
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (this.analysisHistory.length === 0) {
            historyList.innerHTML = '<p>Chưa có lịch sử phân tích nào</p>';
            return;
        }
        
        historyList.innerHTML = this.analysisHistory.map(item => {
            const predictionClass = item.prediction === 'Tài' ? 'over' : 'under';
            const predictionIcon = item.prediction === 'Tài' ? '📈' : '📉';
            return `
                <div class="history-item">
                    <div class="history-hash">${item.hash}</div>
                    <div class="history-prediction ${predictionClass}">
                        ${predictionIcon} ${item.prediction}
                        <small style="display: block; font-size: 0.6rem; opacity: 0.8;">
                            ${item.confidence}% tin cậy
                        </small>
                    </div>
                    <div class="history-timestamp">${new Date(item.timestamp).toLocaleDateString('vi-VN')}</div>
                </div>
            `;
        }).join('');
    }

    // Xóa lịch sử
    clearHistory() {
        this.analysisHistory = [];
        localStorage.removeItem('md5AnalysisHistory');
        this.updateStatistics();
        this.updateDisplay();
        
        // Reset hiển thị phân tích hiện tại
        document.getElementById('currentAnalysis').innerHTML = '<p>Nhập mã MD5 để xem kết quả phân tích</p>';
        document.getElementById('predictionResult').innerHTML = `
            <div class="prediction-value">-</div>
            <div class="confidence-level">Độ tin cậy: -</div>
        `;
    }

    // Export history as JSON
    exportHistory() {
        const dataStr = JSON.stringify(this.analysisHistory, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `md5_analysis_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Global analyzer instance
const analyzer = new MD5Analyzer();

// Hàm phân tích chính
function analyzeMD5() {
    const input = document.getElementById('md5Input').value.trim();
    const currentAnalysis = document.getElementById('currentAnalysis');
    const predictionResult = document.getElementById('predictionResult');
    
    if (!input) {
        currentAnalysis.innerHTML = '<p class="error">Vui lòng nhập mã MD5</p>';
        return;
    }
    
    try {
        // Hiển thị đang tải
        currentAnalysis.innerHTML = '<div class="loading"></div> Đang phân tích...';
        predictionResult.innerHTML = '<div class="loading"></div> Đang dự đoán...';
        
        setTimeout(() => {
            try {
                const analysis = analyzer.analyzeHash(input);
                const prediction = analyzer.predictOverUnder(analysis);
                
                // Lưu vào lịch sử
                analyzer.saveToHistory(analysis, prediction);
                
                // Hiển thị kết quả phân tích
                currentAnalysis.innerHTML = `
                    <div class="success">
                        <strong>Mã Hash:</strong> ${analysis.hash}<br>
                        <strong>Entropy:</strong> ${Math.round(analysis.entropy * 100) / 100}<br>
                        <strong>Số chữ số:</strong> ${analysis.digitCount}/32<br>
                        <strong>Số chữ cái:</strong> ${analysis.letterCount}/32<br>
                        <strong>Mẫu lặp:</strong> ${analysis.repeatingPatterns}<br>
                        <strong>Số tuần tự:</strong> ${analysis.sequentialCount}<br>
                        <strong>Phương sai:</strong> ${Math.round(analysis.variance * 100) / 100}<br>
                        <strong>Byte đầu:</strong> ${analysis.firstByte}<br>
                        <strong>Byte cuối:</strong> ${analysis.lastByte}
                    </div>
                `;
                
                // Hiển thị dự đoán với biểu tượng và mô tả rõ ràng
                const predictionClass = prediction.prediction === 'TRÊN' ? 'over' : 'under';
                predictionResult.innerHTML = `
                    <div class="prediction-value ${predictionClass}">
                        ${prediction.predictionIcon} ${prediction.prediction}
                    </div>
                    <div class="confidence-level">Độ tin cậy: ${prediction.confidence}%</div>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.9;">
                        ${prediction.predictionDescription}
                    </div>
                `;
                
                // Thêm hiệu ứng pulse
                predictionResult.classList.add('pulse');
                setTimeout(() => predictionResult.classList.remove('pulse'), 500);
                
                // Cập nhật hiển thị
                analyzer.updateDisplay();
                
                // Xóa input
                document.getElementById('md5Input').value = '';
                
            } catch (error) {
                currentAnalysis.innerHTML = `<p class="error">Lỗi: ${error.message}</p>`;
                predictionResult.innerHTML = `
                    <div class="prediction-value">-</div>
                    <div class="confidence-level">Độ tin cậy: -</div>
                `;
            }
        }, 500); // Mô phỏng thời gian xử lý
        
    } catch (error) {
        currentAnalysis.innerHTML = `<p class="error">Lỗi: ${error.message}</p>`;
        predictionResult.innerHTML = `
            <div class="prediction-value">-</div>
            <div class="confidence-level">Độ tin cậy: -</div>
        `;
    }
}

// Hàm phân tích hàng loạt
function batchAnalyze() {
    const input = document.getElementById('batchInput').value.trim();
    const lines = input.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Vui lòng nhập ít nhất một mã MD5');
        return;
    }
    
    if (lines.length > 50) {
        alert('Tối đa 50 mã MD5 mỗi lần phân tích');
        return;
    }
    
    let processed = 0;
    let errors = 0;
    
    lines.forEach((line, index) => {
        setTimeout(() => {
            try {
                const hash = line.trim();
                const analysis = analyzer.analyzeHash(hash);
                const prediction = analyzer.predictOverUnder(analysis);
                analyzer.saveToHistory(analysis, prediction);
                processed++;
            } catch (error) {
                errors++;
            }
            
            // Cập nhật hiển thị sau mỗi phân tích
            if (index === lines.length - 1) {
                setTimeout(() => {
                    analyzer.updateDisplay();
                    alert(`Phân tích hàng loạt hoàn thành!\nĐã xử lý: ${processed}\nLỗi: ${errors}`);
                    document.getElementById('batchInput').value = '';
                }, 100);
            }
        }, index * 100); // Trễ các phân tích
    });
}

// Hàm xóa lịch sử
function clearHistory() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân tích?')) {
        analyzer.clearHistory();
    }
}

// Hàm xuất lịch sử
function exportHistory() {
    if (analyzer.analysisHistory.length === 0) {
        alert('Không có lịch sử để xuất');
        return;
    }
    analyzer.exportHistory();
}

// Add enter key support for input
document.getElementById('md5Input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        analyzeMD5();
    }
});

// Khởi tạo hiển thị khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    analyzer.updateDisplay();
});

console.log('Công Cụ Dự Đoán Tỷ Lệ MD5 đã tải thành công!');

// Authentication System
class AuthSystem {
    constructor() {
        this.validKeys = [
            'TTHIENKEY_FORCUSMD5_1028320',
            'TTHIENKEY_FORCUSMD5_2928273',
            'TTHIEN_ACCESS_9182838'
        ];
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        this.checkAuthStatus();
    }

    // Generate dynamic access key (changes daily)
    generateDailyKey() {
        const today = new Date().toDateString();
        const base = 'DAILY_' + btoa(today).slice(0, 8).toUpperCase();
        return base;
    }

    // Validate access key
    validateKey(inputKey) {
        const dailyKey = this.generateDailyKey();
        const allValidKeys = [...this.validKeys, dailyKey];
        return allValidKeys.includes(inputKey.toUpperCase());
    }

    // Set authentication
    setAuth() {
        const authData = {
            authenticated: true,
            timestamp: Date.now()
        };
        localStorage.setItem('md5_auth_session', JSON.stringify(authData));
    }

    // Check authentication status
    checkAuthStatus() {
        const authData = localStorage.getItem('md5_auth_session');
        if (authData) {
            const parsed = JSON.parse(authData);
            const isExpired = Date.now() - parsed.timestamp > this.sessionDuration;
            
            if (parsed.authenticated && !isExpired) {
                this.showMainApp();
                return true;
            } else {
                this.clearAuth();
            }
        }
        this.showLoginScreen();
        return false;
    }

    // Clear authentication
    clearAuth() {
        localStorage.removeItem('md5_auth_session');
    }

    // Show login screen
    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    // Show main application
    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize analyzer if not already done
        if (typeof analyzer !== 'undefined') {
            analyzer.updateDisplay();
        }
    }

    // Get current valid keys (for admin purposes)
    getCurrentKeys() {
        return [...this.validKeys, this.generateDailyKey()];
    }
}

// Global auth instance
const authSystem = new AuthSystem();

// Login validation function
function validateAccess() {
    const keyInput = document.getElementById('accessKey');
    const errorDiv = document.getElementById('loginError');
    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');
    const loginBtn = document.querySelector('.login-btn');
    
    const inputKey = keyInput.value.trim();
    
    if (!inputKey) {
        showLoginError('Vui lòng nhập mã truy cập');
        return;
    }
    
    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    // Simulate authentication delay
    setTimeout(() => {
        if (authSystem.validateKey(inputKey)) {
            authSystem.setAuth();
            authSystem.showMainApp();
            keyInput.value = '';
            
            // Show success message briefly
            btnText.textContent = '✅ Đăng nhập thành công!';
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            
            setTimeout(() => {
                btnText.textContent = 'Đăng Nhập';
                loginBtn.disabled = false;
            }, 1000);
        } else {
            showLoginError('Mã truy cập không hợp lệ. Vui lòng thử lại.');
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            loginBtn.disabled = false;
            keyInput.focus();
        }
    }, 1500);
}

// Show login error
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Add shake animation
    errorDiv.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        errorDiv.style.animation = '';
    }, 500);
}

// Logout function
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        authSystem.clearAuth();
        authSystem.showLoginScreen();
        
        // Clear any sensitive data
        document.getElementById('md5Input').value = '';
        document.getElementById('batchInput').value = '';
    }
}

// Enter key support for login
document.addEventListener('DOMContentLoaded', function() {
    const accessKeyInput = document.getElementById('accessKey');
    if (accessKeyInput) {
        accessKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateAccess();
            }
        });
    }
});

// Add shake animation CSS
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;

// Add the shake animation to the page
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Debug function (remove in production)
function showValidKeys() {
    console.log('Valid access keys:', authSystem.getCurrentKeys());
}

// Console message
console.log('🔐 Hệ thống bảo mật đã được kích hoạt');
console.log('💡 Để xem các mã truy cập hợp lệ, gõ: showValidKeys()');