// Web Platform Deployment Script for No_Gas_Labs™

const { execSync } = require('child_process');
const path = require('path');

// Deployment configuration
const config = {
  frontendDir: path.join(__dirname, '../frontend'),
  backendDir: path.join(__dirname, '../backend'),
  buildDir: path.join(__dirname, '../frontend/dist'),
  deploymentTarget: process.env.DEPLOYMENT_TARGET || 'vercel',
  environment: process.env.NODE_ENV || 'production'
};

// Build frontend application
const buildFrontend = () => {
  console.log('Building frontend application...');
  
  try {
    // Navigate to frontend directory
    process.chdir(config.frontendDir);
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    // Build application
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('Frontend build completed successfully');
    return true;
  } catch (error) {
    console.error('Frontend build failed:', error.message);
    return false;
  }
};

// Deploy frontend application
const deployFrontend = () => {
  console.log(`Deploying frontend to ${config.deploymentTarget}...`);
  
  try {
    // Navigate to frontend directory
    process.chdir(config.frontendDir);
    
    // Deploy based on target
    if (config.deploymentTarget === 'vercel') {
      execSync('vercel --prod', { stdio: 'inherit' });
    } else if (config.deploymentTarget === 'netlify') {
      execSync('netlify deploy --prod', { stdio: 'inherit' });
    } else {
      console.log(`Manual deployment required for target: ${config.deploymentTarget}`);
      console.log(`Build files are located in: ${config.buildDir}`);
    }
    
    console.log('Frontend deployment completed');
    return true;
  } catch (error) {
    console.error('Frontend deployment failed:', error.message);
    return false;
  }
};

// Deploy backend services
const deployBackend = () => {
  console.log('Deploying backend services...');
  
  try {
    // Navigate to backend directory
    process.chdir(config.backendDir);
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    // Deploy to cloud platform (example with Heroku)
    if (process.env.HEROKU_APP_NAME) {
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Deploy backend"', { stdio: 'inherit' });
      execSync(`heroku git:remote -a ${process.env.HEROKU_APP_NAME}`, { stdio: 'inherit' });
      execSync('git push heroku master', { stdio: 'inherit' });
    } else {
      console.log('Manual backend deployment required');
      console.log('Backend files are located in:', config.backendDir);
    }
    
    console.log('Backend deployment completed');
    return true;
  } catch (error) {
    console.error('Backend deployment failed:', error.message);
    return false;
  }
};

// Deploy smart contracts
const deploySmartContracts = () => {
  console.log('Deploying smart contracts...');
  
  try {
    // Navigate to blockchain directory
    process.chdir(path.join(__dirname, '../blockchain'));
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    // Compile contracts
    execSync('npx tact compile', { stdio: 'inherit' });
    
    // Deploy contracts (this would require actual deployment scripts)
    console.log('Smart contracts compiled successfully');
    console.log('Manual deployment to TON network required');
    
    return true;
  } catch (error) {
    console.error('Smart contract deployment failed:', error.message);
    return false;
  }
};

// Main deployment function
const deployWebPlatform = () => {
  console.log('Starting No_Gas_Labs™ web platform deployment...');
  
  // Build and deploy frontend
  if (!buildFrontend()) {
    console.error('Deployment failed during frontend build');
    process.exit(1);
  }
  
  if (!deployFrontend()) {
    console.error('Deployment failed during frontend deployment');
    process.exit(1);
  }
  
  // Deploy backend
  if (!deployBackend()) {
    console.error('Deployment failed during backend deployment');
    process.exit(1);
  }
  
  // Deploy smart contracts
  if (!deploySmartContracts()) {
    console.error('Deployment failed during smart contract deployment');
    process.exit(1);
  }
  
  console.log('No_Gas_Labs™ web platform deployment completed successfully!');
};

// Execute deployment if script is run directly
if (require.main === module) {
  deployWebPlatform();
}

module.exports = {
  buildFrontend,
  deployFrontend,
  deployBackend,
  deploySmartContracts,
  deployWebPlatform
};