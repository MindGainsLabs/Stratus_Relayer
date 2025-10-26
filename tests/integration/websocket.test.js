/**
 * WebSocket Tests for Stratus_Relayer Crypto Tracking
 * Tests the subscribe-crypto-tracking functionality and other WebSocket events
 */

import { io as Client } from 'socket.io-client';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';

describe('Stratus_Relayer WebSocket Tests', function() {
    this.timeout(10000); // 10 second timeout for async operations
    
    let clientSocket;
    let serverPort = process.env.PORT || 80;
    let serverUrl = `http://localhost:${serverPort}`;
    let authToken;

    // Generate a test JWT token
    before(function() {
        authToken = jwt.sign(
            { 
                id: 'test-user-123',
                username: 'test-user',
                email: 'test@example.com'
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    beforeEach(function(done) {
        // Create client socket connection before each test
        clientSocket = new Client(serverUrl, {
            transports: ['websocket'],
            timeout: 5000
        });

        clientSocket.on('connect', () => {
            console.log('Test client connected');
            done();
        });

        clientSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            done(error);
        });
    });

    afterEach(function(done) {
        // Clean up after each test
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        setTimeout(done, 100); // Small delay to ensure cleanup
    });

    describe('Authentication', function() {
        it('should authenticate successfully with valid token', function(done) {
            clientSocket.emit('authenticate', { token: authToken });

            clientSocket.on('authenticated', (data) => {
                expect(data).to.have.property('message');
                expect(data).to.have.property('user');
                expect(data).to.have.property('timestamp');
                expect(data.message).to.equal('Successfully authenticated');
                done();
            });

            clientSocket.on('authentication-failed', (data) => {
                done(new Error(`Authentication failed: ${data.message}`));
            });
        });

        it('should fail authentication with invalid token', function(done) {
            clientSocket.emit('authenticate', { token: 'invalid-token' });

            clientSocket.on('authentication-failed', (data) => {
                expect(data).to.have.property('message');
                expect(data.message).to.equal('Invalid token');
                done();
            });

            clientSocket.on('authenticated', () => {
                done(new Error('Should not authenticate with invalid token'));
            });
        });
    });

    describe('Subscribe Crypto Tracking', function() {
        beforeEach(function(done) {
            // Authenticate before each crypto tracking test
            clientSocket.emit('authenticate', { token: authToken });
            
            clientSocket.on('authenticated', () => {
                done();
            });
        });

        it('should successfully subscribe to crypto tracking', function(done) {
            const subscriptionData = { hours: 24 };
            
            clientSocket.emit('subscribe-crypto-tracking', subscriptionData);

            clientSocket.on('crypto-subscription-confirmed', (data) => {
                expect(data).to.have.property('message');
                expect(data).to.have.property('timestamp');
                expect(data.message).to.equal('Successfully subscribed to crypto tracking updates');
                done();
            });
        });

        it('should receive welcome data after subscription', function(done) {
            clientSocket.emit('subscribe-crypto-tracking', { hours: 12 });

            clientSocket.on('welcome-data', (data) => {
                expect(data).to.have.property('message');
                expect(data).to.have.property('data');
                expect(data).to.have.property('timestamp');
                
                expect(data.data).to.have.property('trackedMessages');
                expect(data.data).to.have.property('stats');
                expect(data.data).to.have.property('filters');
                expect(data.data).to.have.property('clientsConnected');
                
                expect(data.data.trackedMessages).to.be.an('array');
                expect(data.data.stats).to.be.an('object');
                
                done();
            });
        });

        it('should receive structured crypto data broadcasts', function(done) {
            let receivedWelcome = false;
            
            clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });

            // Wait for welcome data first
            clientSocket.on('welcome-data', () => {
                receivedWelcome = true;
            });

            // Listen for broadcast data
            clientSocket.on('structured-crypto-data', (data) => {
                if (!receivedWelcome) return; // Ignore if not properly subscribed
                
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('message');
                expect(data).to.have.property('data');
                
                expect(data.data).to.have.property('trackedMessages');
                expect(data.data).to.have.property('stats');
                expect(data.data).to.have.property('filters');
                
                expect(data.data.trackedMessages).to.be.an('array');
                expect(data.data.stats).to.have.property('tokens');
                expect(data.data.stats).to.have.property('wallets');
                expect(data.data.stats).to.have.property('totalSol');
                
                done();
            });

            // Trigger a manual broadcast after a short delay
            setTimeout(() => {
                clientSocket.emit('request-structured-crypto-data', { hours: 24 });
            }, 1000);
        });

        it('should successfully unsubscribe from crypto tracking', function(done) {
            // First subscribe
            clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });

            clientSocket.on('crypto-subscription-confirmed', () => {
                // Then unsubscribe
                clientSocket.emit('unsubscribe-crypto-tracking');
            });

            clientSocket.on('crypto-subscription-cancelled', (data) => {
                expect(data).to.have.property('message');
                expect(data).to.have.property('timestamp');
                expect(data.message).to.equal('Successfully unsubscribed from crypto tracking updates');
                done();
            });
        });
    });

    describe('Token Statistics', function() {
        beforeEach(function(done) {
            // Authenticate and subscribe before each test
            clientSocket.emit('authenticate', { token: authToken });
            
            clientSocket.on('authenticated', () => {
                clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });
                done();
            });
        });

        it('should receive token statistics on request', function(done) {
            clientSocket.emit('request-token-stats', { hours: 12 });

            clientSocket.on('token-stats', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('message');
                expect(data).to.have.property('data');
                
                expect(data.data).to.have.property('tokens');
                expect(data.data).to.have.property('wallets');
                expect(data.data).to.have.property('totalSol');
                expect(data.data).to.have.property('summary');
                expect(data.data).to.have.property('generatedAt');
                expect(data.data).to.have.property('timeframe');
                
                expect(data.data.tokens).to.be.an('array');
                expect(data.data.wallets).to.be.an('array');
                expect(data.data.totalSol).to.be.a('number');
                
                done();
            });
        });
    });

    describe('Token Search', function() {
        beforeEach(function(done) {
            clientSocket.emit('authenticate', { token: authToken });
            
            clientSocket.on('authenticated', () => {
                clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });
                done();
            });
        });

        it('should return search results for valid query', function(done) {
            const searchQuery = { query: 'SOL', hours: 24 };
            
            clientSocket.emit('search-tokens', searchQuery);

            clientSocket.on('token-search-results', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('message');
                expect(data).to.have.property('results');
                expect(data).to.have.property('data');
                
                expect(data.data).to.have.property('tokens');
                expect(data.data).to.have.property('matchingMessages');
                
                expect(data.data.tokens).to.be.an('array');
                expect(data.data.matchingMessages).to.be.an('array');
                expect(data.results).to.be.a('number');
                
                done();
            });
        });

        it('should handle search error for empty query', function(done) {
            clientSocket.emit('search-tokens', { query: '', hours: 24 });

            clientSocket.on('token-search-error', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('error');
                expect(data.error).to.equal('Search query is required');
                done();
            });
        });
    });

    describe('Top Tokens', function() {
        beforeEach(function(done) {
            clientSocket.emit('authenticate', { token: authToken });
            
            clientSocket.on('authenticated', () => {
                clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });
                done();
            });
        });

        it('should return top tokens by totalSol metric', function(done) {
            const options = { metric: 'totalSol', hours: 24, limit: 5 };
            
            clientSocket.emit('request-top-tokens', options);

            clientSocket.on('top-tokens', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('message');
                expect(data).to.have.property('data');
                
                expect(data.data).to.have.property('tokens');
                expect(data.data).to.have.property('metric');
                expect(data.data).to.have.property('timeframe');
                
                expect(data.data.tokens).to.be.an('array');
                expect(data.data.metric).to.equal('totalSol');
                expect(data.data.tokens.length).to.be.at.most(5);
                
                done();
            });
        });

        it('should handle invalid metric error', function(done) {
            const options = { metric: 'invalidMetric', hours: 24, limit: 5 };
            
            clientSocket.emit('request-top-tokens', options);

            clientSocket.on('top-tokens-error', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('error');
                expect(data).to.have.property('validMetrics');
                expect(data.error).to.equal('Invalid metric');
                done();
            });
        });
    });

    describe('Connection Health', function() {
        it('should respond to ping with pong', function(done) {
            clientSocket.emit('ping');

            clientSocket.on('pong', (data) => {
                expect(data).to.have.property('timestamp');
                expect(data).to.have.property('clientId');
                expect(data.clientId).to.equal(clientSocket.id);
                done();
            });
        });
    });

    describe('Authentication Required Events', function() {
        it('should require authentication for protected events', function(done) {
            // Try to subscribe without authentication
            clientSocket.emit('subscribe-crypto-tracking', { hours: 24 });

            clientSocket.on('authentication-required', (data) => {
                expect(data).to.have.property('message');
                expect(data.message).to.equal('Authentication required for this action');
                done();
            });
        });
    });
});
