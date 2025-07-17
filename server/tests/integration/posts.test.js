// posts.test.js - Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

// Increase the timeout for Jest
jest.setTimeout(30000);

// Define variables to be used across tests
let mongoServer;
let testUser;
let testToken;
let testPost;
let anotherUser;
let anotherUserToken;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');
    
    // Create test users and generate tokens
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    testToken = generateToken(testUser._id);
    
    anotherUser = await User.create({
      name: 'Another User',
      email: 'another@example.com',
      password: 'password123'
    });
    
    anotherUserToken = generateToken(anotherUser._id);
    
    // Create a test post
    testPost = await Post.create({
      title: 'Test Post',
      content: 'This is a test post content',
      author: testUser._id
    });
  } catch (error) {
    console.error('MongoDB setup error:', error);
  }
});

// Clean up after all tests are done
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clean up database between tests
afterEach(async () => {
  // Only clean collections other than users and the test post
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key !== 'users') {
      await collections[key].deleteMany({ _id: { $ne: testPost._id } });
    }
  }
});

// Test GET all posts
describe('GET /api/posts', () => {
  test('should return all posts', async () => {
    const response = await request(app).get('/api/posts');
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

// Test GET single post
describe('GET /api/posts/:id', () => {
  test('should return a single post by ID', async () => {
    const response = await request(app).get(`/api/posts/${testPost._id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testPost._id.toString());
  });
  
  test('should return 404 for non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/api/posts/${fakeId}`);
    
    expect(response.statusCode).toBe(404);
  });
});

// Test POST new post
describe('POST /api/posts', () => {
  test('should create a new post when authenticated', async () => {
    const postData = {
      title: 'New Test Post',
      content: 'This is a new test post content'
    };
    
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${testToken}`)
      .send(postData);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(postData.title);
    expect(response.body.author).toBe(testUser._id.toString());
  });
  
  test('should return 401 if not authenticated', async () => {
    const postData = {
      title: 'Unauthorized Post',
      content: 'This post should not be created'
    };
    
    const response = await request(app)
      .post('/api/posts')
      .send(postData);
    
    expect(response.statusCode).toBe(401);
  });
});

// Test PUT update post
describe('PUT /api/posts/:id', () => {
  test('should update a post when authenticated as author', async () => {
    const updatedData = {
      title: 'Updated Test Post',
      content: 'This content has been updated'
    };
    
    const response = await request(app)
      .put(`/api/posts/${testPost._id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(updatedData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(updatedData.title);
  });
  
  test('should return 401 if not authenticated', async () => {
    const updatedData = {
      title: 'Unauthorized Update',
      content: 'This update should fail'
    };
    
    const response = await request(app)
      .put(`/api/posts/${testPost._id}`)
      .send(updatedData);
    
    expect(response.statusCode).toBe(401);
  });
  
  test('should return 403 if not the author', async () => {
    const updatedData = {
      title: 'Forbidden Update',
      content: 'This update should be forbidden'
    };
    
    const response = await request(app)
      .put(`/api/posts/${testPost._id}`)
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send(updatedData);
    
    expect(response.statusCode).toBe(403);
  });
});

// Test DELETE post
describe('DELETE /api/posts/:id', () => {
  test('should delete a post when authenticated as author', async () => {
    // Create a post to delete
    const postToDelete = await Post.create({
      title: 'Post to Delete',
      content: 'This post will be deleted',
      author: testUser._id
    });
    
    const response = await request(app)
      .delete(`/api/posts/${postToDelete._id}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.statusCode).toBe(200);
    
    // Verify it was deleted
    const deletedPost = await Post.findById(postToDelete._id);
    expect(deletedPost).toBeNull();
  });
  
  test('should return 401 if not authenticated', async () => {
    const response = await request(app)
      .delete(`/api/posts/${testPost._id}`);
    
    expect(response.statusCode).toBe(401);
  });
  
  test('should return 403 if not the author', async () => {
    const response = await request(app)
      .delete(`/api/posts/${testPost._id}`)
      .set('Authorization', `Bearer ${anotherUserToken}`);
    
    expect(response.statusCode).toBe(403);
  });
});