FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Accept build arguments
ARG VITE_LOCAL_API_URL
ARG VITE_BACKEND_TYPE
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CLOUDBOX_URL
ARG VITE_CLOUDBOX_API_KEY

# Set environment variables from build args
ENV VITE_LOCAL_API_URL=$VITE_LOCAL_API_URL
ENV VITE_BACKEND_TYPE=$VITE_BACKEND_TYPE
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_CLOUDBOX_URL=$VITE_CLOUDBOX_URL
ENV VITE_CLOUDBOX_API_KEY=$VITE_CLOUDBOX_API_KEY

# Copy package files first
COPY package*.json ./

# Install dependencies using npm
RUN npm ci || npm install

# Copy all source files (excluding .dockerignore files)
COPY . .

# Debug: List files to see what's available
RUN echo "Files in working directory:" && ls -la
RUN echo "Contents of index.html:" && head -5 index.html

# Build the app
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]