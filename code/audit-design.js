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
    console.log(`  Main Container Padding: ${mainContainerBox ? `left:${mainContainerBox.x.toFixed(0)}, top:${mainContainerBox.y.toFixed(0)}` : 'N/A'}`);
    
    // Check game board
    const gameBoard = await page.$('.game-board');
    const gameBoardBox = gameBoard ? await gameBoard.boundingBox() : null;
    console.log(`  Game Board: ${gameBoardBox ? `${gameBoardBox.width.toFixed(0)}x${gameBoardBox.height.toFixed(0)}` : 'NOT FOUND'}`);
    console.log(`  Game Board Position: ${gameBoardBox ? `x:${gameBoardBox.x.toFixed(0)}, y:${gameBoardBox.y.toFixed(0)}` : 'N/A'}`);
    
    // Check if board fills main container (no excessive gaps)
    if (mainContainerBox && gameBoardBox) {
      const horizontalGap = mainContainerBox.width - gameBoardBox.width;
      const verticalGap = mainContainerBox.height - gameBoardBox.height;
      const gapPercentage = ((horizontalGap + verticalGap) / (mainContainerBox.width + mainContainerBox.height) * 100).toFixed(1);
      console.log(`  Total Gap: ${(horizontalGap + verticalGap).toFixed(0)}px (${gapPercentage}%)`);
      console.log(`  Board Coverage: ${((gameBoardBox.width * gameBoardBox.height) / (mainContainerBox.width * mainContainerBox.height) * 100).toFixed(1)}% of container`);
    }
    
    // Check cells for 5x5 board - verify spacing
    const cells = await page.$$('.board-5x5 .cell');
    console.log(`  5x5 Board Cells: ${cells.length}`);
    
    if (cells.length > 0) {
      const firstCell = await cells[0].boundingBox();
      const lastCell = await cells[cells.length - 1].boundingBox();
      const boardEl = await page.$('.board-5x5');
      const boardBox = boardEl ? await boardEl.boundingBox() : null;
      
      console.log(`  First Cell: ${firstCell ? `${firstCell.width.toFixed(0)}x${firstCell.height.toFixed(0)} at (${firstCell.x.toFixed(0)}, ${firstCell.y.toFixed(0)})` : 'N/A'}`);
      console.log(`  Last Cell: ${lastCell ? `${lastCell.width.toFixed(0)}x${lastCell.height.toFixed(0)} at (${lastCell.x.toFixed(0)}, ${lastCell.y.toFixed(0)})` : 'N/A'}`);
      
      if (firstCell && boardBox) {
        const cellStartGap = firstCell.x - boardBox.x;
        const cellEndGap = (boardBox.x + boardBox.width) - (lastCell.x + lastCell.width);
        console.log(`  Cell-to-Board Start Gap: ${cellStartGap.toFixed(1)}px`);
        console.log(`  Cell-to-Board End Gap: ${cellEndGap.toFixed(1)}px`);
      }
    }
    
    // Check CSS variables
    const cssVars = await page.evaluate(() => {
      const board = document.querySelector('.board-5x5');
      if (!board) return null;
      const style = getComputedStyle(board);
      return {
        cellSize: style.getPropertyValue('--cell-size'),
        cellFontSize: style.getPropertyValue('--cell-font-size')
      };
    });
    console.log(`  CSS Variables: --cell-size: ${cssVars?.cellSize}, --cell-font-size: ${cssVars?.cellFontSize}`);
    
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
    const board7x7Box = board7x7 ? await board7x7.boundingBox() : null;
    console.log(`  7x7 Board present: ${board7x7 ? 'YES' : 'NO'}`);
    console.log(`  7x7 Board size: ${board7x7Box ? `${board7x7Box.width.toFixed(0)}x${board7x7Box.height.toFixed(0)}` : 'N/A'}`);
    const cells7x7 = await page.$$('.board-7x7 .cell');
    console.log(`  7x7 Board Cells: ${cells7x7.length}`);
    if (cells7x7.length > 0) {
      const cell7x7 = await cells7x7[0].boundingBox();
      console.log(`  7x7 Cell Size: ${cell7x7 ? `${cell7x7.width.toFixed(0)}x${cell7x7.height.toFixed(0)}` : 'N/A'}`);
    }
  }
  
  // Click 9x9 button
  const btn9x9 = await page.$('.size-btn:has-text("9x9")');
  if (btn9x9) {
    await btn9x9.click();
    await page.waitForTimeout(500);
    const board9x9 = await page.$('.board-9x9');
    const board9x9Box = board9x9 ? await board9x9.boundingBox() : null;
    console.log(`  9x9 Board present: ${board9x9 ? 'YES' : 'NO'}`);
    console.log(`  9x9 Board size: ${board9x9Box ? `${board9x9Box.width.toFixed(0)}x${board9x9Box.height.toFixed(0)}` : 'N/A'}`);
    const cells9x9 = await page.$$('.board-9x9 .cell');
    console.log(`  9x9 Board Cells: ${cells9x9.length}`);
    if (cells9x9.length > 0) {
      const cell9x9 = await cells9x9[0].boundingBox();
      console.log(`  9x9 Cell Size: ${cell9x9 ? `${cell9x9.width.toFixed(0)}x${cell9x9.height.toFixed(0)}` : 'N/A'}`);
    }
  }
  
  // Check for any clamp() or !important in styles
  console.log('\n--- Checking for Removed CSS Issues ---');
  const cssIssues = await page.evaluate(() => {
    const issues = [];
    // Check all style tags
    const styleTags = document.querySelectorAll('style');
    styleTags.forEach((tag, i) => {
      if (tag.textContent.includes('!important')) {
        issues.push(`Style tag ${i} contains !important`);
      }
      if (tag.textContent.includes('clamp(')) {
        issues.push(`Style tag ${i} contains clamp()`);
      }
    });
    return issues;
  });
  
  if (cssIssues.length === 0) {
    console.log('  No clamp() or !important found in stylesheets');
  } else {
    cssIssues.forEach(issue => console.log(`  ${issue}`));
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
