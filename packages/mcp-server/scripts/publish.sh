#!/usr/bin/env bash

# Publish script for @webrenew/unicon-mcp-server
# Uses NPM_TOKEN from .env file

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Publishing @webrenew/unicon-mcp-server${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Run this from packages/mcp-server/${NC}"
  exit 1
fi

# Load NPM_TOKEN from root .env file (check .env.local first)
if [ -f "../../.env.local" ]; then
  echo -e "${YELLOW}Loading NPM_TOKEN from .env.local${NC}"
  export $(grep NPM_TOKEN ../../.env.local | xargs)
elif [ -f "../../.env" ]; then
  echo -e "${YELLOW}Loading NPM_TOKEN from .env${NC}"
  export $(grep NPM_TOKEN ../../.env | xargs)
else
  echo -e "${RED}Error: .env.local or .env file not found in root${NC}"
  exit 1
fi

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
  echo -e "${RED}Error: NPM_TOKEN not found in .env file${NC}"
  echo "Add NPM_TOKEN=your_token to .env or .env.local"
  exit 1
fi

# Configure npm to use the token
echo -e "${YELLOW}Configuring npm authentication${NC}"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Clean and build
echo -e "${YELLOW}Cleaning dist directory${NC}"
rm -rf dist

echo -e "${YELLOW}Building package${NC}"
npm run build

# Check version
VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Package version: ${VERSION}${NC}"

# Confirm publish
echo ""
echo -e "${YELLOW}Ready to publish @webrenew/unicon-mcp-server@${VERSION}${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Publish cancelled${NC}"
  exit 1
fi

# Publish
echo -e "${YELLOW}Publishing to npm...${NC}"
npm publish --access public

# Success
echo ""
echo -e "${GREEN}✓ Successfully published @webrenew/unicon-mcp-server@${VERSION}${NC}"
echo ""
echo "View at: https://www.npmjs.com/package/@webrenew/unicon-mcp-server"
echo "Install with: npx @webrenew/unicon-mcp-server"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test installation: npx @webrenew/unicon-mcp-server"
echo "2. Update documentation if needed"
echo "3. Announce the release"
