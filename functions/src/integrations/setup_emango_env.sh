#!/bin/bash

# --- eMango Pay Python Environment Setup Script (macOS/Linux) ---

echo "🚀 Setting up eMango Pay Python Environment..."

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and rerun this script."
    echo "📋 Installation guide: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo "📚 Installing requirements..."
pip install -r requirements.txt

# Create .env template if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env template..."
    cat > .env << EOF
EMANGO_MERCH_SEQ=your_merchant_id
EMANGO_SECRET_KEY=your_secret_key
EMANGO_API_BASE_URL=https://test.e-mango.ph
PORT=5000
EOF
    echo "✅ .env file created. Please fill in your credentials."
else
    echo "ℹ️ .env file already exists. Please verify your credentials."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Fill in your eMango Pay credentials in the .env file"
echo "   2. To activate the environment: source venv/bin/activate"
echo "   3. To start the service: python emango_pay_service.py"
echo ""
echo "🔗 Test the service at: http://localhost:5000/health" 