# Billify Stripe API — Node.js + Express
FROM node:18-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --production

COPY stripe-server.js plan-limits.json ./

EXPOSE 3000
ENV PORT=3000

USER node
CMD ["node", "stripe-server.js"]
