FROM python:3.9-slim

WORKDIR /app

# Install uv for dependency management
RUN pip install --no-cache-dir uv

# Copy project configuration
COPY pyproject.toml .

# Install dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy application files
COPY . .

# Create directory structure if it doesn't exist
RUN mkdir -p reward_board/static/css reward_board/static/js reward_board/data
RUN chmod 777 reward_board/data  # Ensure write permissions

# Ensure the Flask app is accessible outside the container
ENV FLASK_APP=reward_board.app
ENV FLASK_ENV=production

# Expose the port the app will run on
EXPOSE 5000

# Command to run the application
CMD ["python", "-m", "reward_board.app"]