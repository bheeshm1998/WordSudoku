const { chromium } = require('playwright');

const viewports = {
  phone: { name: 'Phone', width: 375, height: 667 },
  tablet: { name: 'iPad', width: 768, height: 1024 },
  desktop: { name: 'Desktop', width: 1920, height: 1080 }
};

async function auditDesign() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`[pageerror] ${error.message}`);
  });

  console.log('=== WordSudoku Responsive Design Audit ===\n');

  for (const [key, viewport] of Object.entries(viewports)) {
    console.log(`--- Testing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
    
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('http://localhost:4001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Check main container
    const mainContainer = await page.$('.main-container');
    const mainContainerBox = mainContainer ? await mainContainer.boundingBox() : null;
    console.log(`  Main Container: ${mainContainerBox ? `${mainContainerBox.width.toFixed(0)}x${mainContainerBox.height.toFixed(0)}` : 'NOT FOUND'}`);
    
    // Check game board
    const gameBoard = await page.$('.game-board');
    const gameBoardBox = gameBoard ? await gameBoard.boundingBox() : null;
    console.log(`  Game Board: ${gameBoardBox ? `${gameBoardBox.width.toFixed(0)}x${gameBoardBox.height.toFixed(0)}` : 'NOT FOUND'}`);
    
    // Check if board fills main container (no excessive gaps)
    if (mainContainerBox && gameBoardBox) {
      const horizontalGap = mainContainerBox.width - gameBoardBox.width;
      const verticalGap = mainContainerBox.height - gameBoardBox.height;
      console.log(`  Horizontal Gap: ${horizontalGap.toFixed(0)}px`);
      console.log(`  Vertical Gap: ${verticalGap.toFixed(0)}px`);
    }
    
    // Check cells for 5x5 board
    const cells = await page.$$('.board-5x5 .cell');
    console.log(`  5x5 Board Cells: ${cells.length}`);
    
    if (cells.length > 0) {
      const firstCell = await cells[0].boundingBox();
      console.log(`  Cell Size: ${firstCell ? `${firstCell.width.toFixed(0)}x${firstCell.height.toFixed(0)}` : 'N/A'}`);
    }
    
    // Check for CSS issues - verify no clamp or !important in computed styles
    const boardStyles = await page.evaluate(() => {
      const board = document.querySelector('.game-board');
      if (!board) return null;
      const styles = window.getComputedStyle(board);
      return {
        padding: styles.padding,
        maxWidth: styles.maxWidth
      };
    });
    console.log(`  Board Computed Styles - padding: ${boardStyles?.padding}, maxWidth: ${boardStyles?.maxWidth}`);
    
    console.log('');
  }
  
  // Test board size switching
  console.log('--- Testing Board Size Switching ---');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  // Click 7x7 button
  const btn7x7 = await page.$('.size-btn:has-text("7x7")');
  if (btn7x7) {
    await btn7x7.click();
    await page.waitForTimeout(500);
    const board7x7 = await page.$('.board-7x7');
    console.log(`  7x7 Board present: ${board7x7 ? 'YES' : 'NO'}`);
    const cells7x7 = await page.$$('.board-7x7 .cell');
    console.log(`  7x7 Board Cells: ${cells7x7.length}`);
  }
  
  // Click 9x9 button
  const btn9x9 = await page.$('.size-btn:has-text("9x9")');
  if (btn9x9) {
    await btn9x9.click();
    await page.waitForTimeout(500);
    const board9x9 = await page.$('.board-9x9');
    console.log(`  9x9 Board present: ${board9x9 ? 'YES' : 'NO'}`);
    const cells9x9 = await page.$$('.board-9x9 .cell');
    console.log(`  9x9 Board Cells: ${cells9x9.length}`);
  }
  
  console.log('\n--- Console Errors ---');
  if (errors.length === 0) {
    console.log('No console errors detected.');
  } else {
    errors.forEach(e => console.log(e));
  }
  
  await browser.close();
  console.log('\n=== Audit Complete ===');
}

auditDesign().catch(console.error);
