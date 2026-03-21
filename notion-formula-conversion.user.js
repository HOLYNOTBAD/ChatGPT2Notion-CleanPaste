// ==UserScript==
// @name         Notion-Formula-Auto-Conversion-Tool
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  自动公式转换工具
// @author       skyance
// @match        https://www.notion.so/*
// @grant        GM_addStyle
// @github       https://github.com/skyance/Notion-Formula-Auto-Conversion-Tool
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @downloadURL https://update.greasyfork.org/scripts/525730/Notion-Formula-Auto-Conversion-Tool.user.js
// @updateURL https://update.greasyfork.org/scripts/525730/Notion-Formula-Auto-Conversion-Tool.meta.js
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        /* 基础样式 */
        #formula-helper {
            position: fixed;
            bottom: 90px;
            right: 20px;
            z-index: 9999;
            background: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 30px,
                       rgba(0, 0, 0, 0.1) 0px 1px 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 200px;
            transform-origin: center;
            will-change: transform;
            overflow: hidden;
        }

        .content-wrapper {
            padding: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
        }

        /* 收起状态 */
        #formula-helper.collapsed {
            width: 48px;
            min-width: 48px;
            height: 48px;
            padding: 12px;
            opacity: 0.9;
            transform: scale(0.98);
            border-radius: 50%;
        }

        #formula-helper.collapsed .content-wrapper {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #formula-helper #convert-btn,
        #formula-helper #progress-container,
        #formula-helper #status-text {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 1;
            transform: translateY(0);
            transform-origin: center;
        }

        /* 收起按钮样式 */
        #collapse-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
            z-index: 2;
        }

        #collapse-btn:hover {
            transform: scale(1.1);
        }

        #collapse-btn:active {
            transform: scale(0.95);
        }

        #collapse-btn svg {
            width: 16px;
            height: 16px;
            fill: #4b5563;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #formula-helper.collapsed #collapse-btn {
            position: static;
            width: 100%;
            height: 100%;
        }

        #formula-helper.collapsed #collapse-btn svg {
            transform: rotate(180deg);
        }

        @media (hover: hover) {
            #formula-helper:not(.collapsed):hover {
                transform: translateY(-2px);
                box-shadow: rgba(0, 0, 0, 0.15) 0px 15px 35px,
                           rgba(0, 0, 0, 0.12) 0px 3px 10px;
            }

            #formula-helper.collapsed:hover {
                opacity: 1;
                transform: scale(1.05);
            }
        }

        /* 按钮样式 */
        #convert-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 20px;
            margin-bottom: 12px;
            width: 100%;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
        }

        #convert-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            opacity: 0;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #convert-btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        #convert-btn:hover::after {
            opacity: 1;
        }

        #convert-btn:active {
            transform: translateY(1px);
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
        }

        #convert-btn.processing {
            background: #ef4444;
            cursor: pointer;
            transform: scale(0.98);
            box-shadow: none;
        }

        /* 状态和进度显示 */
        #status-text {
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 10px;
            line-height: 1.5;
        }

        #progress-container {
            background: #e5e7eb;
            height: 4px;
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 15px;
            transform-origin: center;
        }

        #progress-bar {
            background: #2563eb;
            height: 100%;
            width: 0%;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        #progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.3),
                transparent
            );
            animation: progress-shine 1.5s linear infinite;
        }

        @keyframes progress-shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* 动画效果 */
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
        }

        .processing #status-text {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
    `);

    // 缓存DOM元素
    let panel, statusText, convertBtn, progressBar, progressContainer, collapseBtn;
    let isProcessing = false;
    let shouldStop = false;
    let formulaCount = 0;
    let isCollapsed = true;
    let hoverTimer = null;
    let convertedBlockCount = 0;

    const TIMING = {
        menuScan: 30,
        keyPress: 18,
        clickStep: 12,
        textChar: 1,
        focus: 35,
        delete: 50,
        refocus: 45,
        commandMenu: 120,
        commandConfirm: 55,
        contentInsert: 60,
        blockCommit: 80,
        inlinePanel: 55,
        selectAll: 18,
        inlineCommit: 30,
        betweenBlocks: 70,
        retryStart: 250,
        retryStatus: 90
    };

    function createPanel() {
        panel = document.createElement('div');
        panel.id = 'formula-helper';
        panel.classList.add('collapsed');
        panel.innerHTML = `
            <button id="collapse-btn">
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
            <div class="content-wrapper">
                <button id="convert-btn">🔄 (0)</button>
                <div id="progress-container">
                    <div id="progress-bar"></div>
                </div>
                <div id="status-text">就绪</div>
            </div>
        `;
        document.body.appendChild(panel);

        statusText = panel.querySelector('#status-text');
        convertBtn = panel.querySelector('#convert-btn');
        progressBar = panel.querySelector('#progress-bar');
        progressContainer = panel.querySelector('#progress-container');
        collapseBtn = panel.querySelector('#collapse-btn');

        // 添加收起按钮事件
        collapseBtn.addEventListener('click', toggleCollapse);

        // 添加鼠标悬停事件
        panel.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimer);
            if (isCollapsed) {
                hoverTimer = setTimeout(() => {
                    panel.classList.remove('collapsed');
                    isCollapsed = false;
                }, 150); // 减少展开延迟时间
            }
        });

        panel.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
            if (!isCollapsed && !isProcessing) { // 添加处理中状态判断
                hoverTimer = setTimeout(() => {
                    panel.classList.add('collapsed');
                    isCollapsed = true;
                }, 800); // 适当减少收起延迟
            }
        });
    }

    function toggleCollapse() {
        isCollapsed = !isCollapsed;
        panel.classList.toggle('collapsed');
    }

    function updateProgress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    function updateStatus(text, timeout = 0) {
        statusText.textContent = text;
        if (timeout) {
            setTimeout(() => statusText.textContent = '就绪', timeout);
        }
        console.log('[状态]', text);
    }

    // 公式查找
    function findFormulas(text) {
        const formulas = [];
        const combinedRegex = /\$\$(.*?)\$\$|\$([^\$\n]+?)\$|\\\((.*?)\\\)|\\\[(.*?)\\\]/gs;

        let match;
        while ((match = combinedRegex.exec(text)) !== null) {
            const [fullMatch, blockFormula, inlineFormula, latexFormula, latexBlockFormula] = match;
            const formula = fullMatch;

            if (formula) {
                // 判断公式类型：块公式（行间）或行内公式
                const isBlockFormula = fullMatch.startsWith('$$') || fullMatch.startsWith('\\[');
                formulas.push({
                    formula: fullMatch,
                    index: match.index,
                    type: isBlockFormula ? 'block' : 'inline',
                    content: blockFormula || inlineFormula || latexFormula || latexBlockFormula
                });
            }
        }

        return formulas;
    }

    function isStandaloneBlockFormula(editor, formulas) {
        if (!editor || formulas.length !== 1) return false;

        const [formulaObj] = formulas;
        if (formulaObj.type !== 'block' || isInTable(editor)) return false;

        return editor.textContent.trim() === formulaObj.formula.trim();
    }

    function buildMergedBlockFormula(formulas) {
        const lines = formulas
            .map(formulaObj => formulaObj.content.trim())
            .filter(Boolean);

        if (lines.length <= 1) {
            return lines[0] || '';
        }

        return [
            '\\left\\{',
            '\\begin{array}{l}',
            lines.join(' \\\\ '),
            '\\end{array}',
            '\\right.'
        ].join(' ');
    }

    function isMergeableBlockSeparator(separatorText) {
        return /^[\s,，;；:：]*$/.test(separatorText);
    }

    function buildEditorTasks(editor, formulas) {
        const tasks = [];
        const text = editor.textContent;
        let i = 0;

        while (i < formulas.length) {
            const current = formulas[i];

            if (current.type === 'block' && !isInTable(editor)) {
                const grouped = [current];
                let j = i + 1;

                while (j < formulas.length) {
                    const previous = formulas[j - 1];
                    const next = formulas[j];
                    const separator = text.slice(previous.index + previous.formula.length, next.index);

                    if (next.type !== 'block' || !isMergeableBlockSeparator(separator)) {
                        break;
                    }

                    grouped.push(next);
                    j++;
                }

                if (grouped.length > 1) {
                    const first = grouped[0];
                    const last = grouped[grouped.length - 1];
                    const formulaSource = text.slice(first.index, last.index + last.formula.length);

                    tasks.push({
                        editor,
                        type: 'block-group',
                        formula: formulaSource,
                        content: buildMergedBlockFormula(grouped),
                        sourceEditors: [editor],
                        sourceCount: grouped.length
                    });

                    i = j;
                    continue;
                }
            }

            tasks.push({
                editor,
                type: current.type,
                formula: current.formula,
                content: current.content,
                sourceCount: 1
            });
            i++;
        }

        return tasks;
    }

    function collectConversionTasks(editors) {
        const tasks = [];
        const editorEntries = Array.from(editors).map(editor => {
            const formulas = findFormulas(editor.textContent);
            return { editor, formulas };
        });

        let i = 0;
        while (i < editorEntries.length) {
            const current = editorEntries[i];

            if (isStandaloneBlockFormula(current.editor, current.formulas)) {
                const grouped = [current];
                let j = i + 1;

                while (j < editorEntries.length && isStandaloneBlockFormula(editorEntries[j].editor, editorEntries[j].formulas)) {
                    grouped.push(editorEntries[j]);
                    j++;
                }

                if (grouped.length > 1) {
                    tasks.push({
                        editor: grouped[0].editor,
                        type: 'block-group',
                        formula: grouped.map(item => item.formulas[0].formula).join(''),
                        content: buildMergedBlockFormula(grouped.map(item => item.formulas[0])),
                        sourceEditors: grouped.map(item => item.editor),
                        sourceCount: grouped.length
                    });
                    i = j;
                    continue;
                }
            }

            tasks.push(...buildEditorTasks(current.editor, current.formulas));
            i++;
        }

        return tasks;
    }

    // 操作区域查找
    async function findOperationArea() {
        const selector = '.notion-overlay-container';
        for (let i = 0; i < 5; i++) {
            const areas = document.querySelectorAll(selector);
            const area = Array.from(areas).find(a =>
                a.style.display !== 'none' && a.querySelector('[role="button"]')
            );

            if (area) {
                console.log('找到操作区域');
                return area;
            }
            await sleep(TIMING.menuScan);
        }
        return null;
    }

    // 按钮查找
    async function findButton(area, options = {}) {
        const {
            buttonText = [],
            hasSvg = false,
            attempts = 8
        } = options;

        const buttons = area.querySelectorAll('[role="button"]');
        const cachedButtons = Array.from(buttons);

        for (let i = 0; i < attempts; i++) {
            const button = cachedButtons.find(btn => {
                if (hasSvg && btn.querySelector('svg.equation')) return true;
                const text = btn.textContent.toLowerCase();
                return buttonText.some(t => text.includes(t));
            });

            if (button) {
                return button;
            }
            await sleep(TIMING.menuScan);
        }
        return null;
    }

    // 文本输入模拟
    async function simulateTyping(text, quick = false) {
        const activeElement = document.activeElement;
        if (activeElement) {
            if (quick) {
                // 快速模式：直接插入整段文本 (模拟粘贴)
                const inputEvent = new InputEvent('beforeinput', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: text
                });
                activeElement.dispatchEvent(inputEvent);

                document.execCommand('insertText', false, text);

                const inputEventAfter = new InputEvent('input', {
                    bubbles: true,
                    cancelable: false,
                    inputType: 'insertText',
                    data: text
                });
                activeElement.dispatchEvent(inputEventAfter);
            } else {
                // 普通模式：逐字输入 (用于触发命令菜单等)
                for (const char of text) {
                    const inputEvent = new InputEvent('beforeinput', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: char
                    });
                    activeElement.dispatchEvent(inputEvent);

                    document.execCommand('insertText', false, char);

                    const inputEventAfter = new InputEvent('input', {
                        bubbles: true,
                        cancelable: false,
                        inputType: 'insertText',
                        data: char
                    });
                    activeElement.dispatchEvent(inputEventAfter);

                    await sleep(TIMING.textChar);
                }
            }
        }
    }

    // 单个按键模拟
    async function simulateKey(keyName) {
        const keyInfo = getKeyCode(keyName);
        const keydownEvent = new KeyboardEvent('keydown', {
            key: keyInfo.key,
            code: keyInfo.code,
            keyCode: keyInfo.keyCode,
            bubbles: true
        });
        const keyupEvent = new KeyboardEvent('keyup', {
            key: keyInfo.key,
            code: keyInfo.code,
            keyCode: keyInfo.keyCode,
            bubbles: true
        });

        document.dispatchEvent(keydownEvent);
        await sleep(TIMING.keyPress);
        document.dispatchEvent(keyupEvent);
    }

    // 聚焦到目标元素，避免表格单元格或行顺序错位
    async function ensureFocus(element) {
        if (!element) return;
        element.focus();
        await simulateClick(element);
    }

    async function deleteEditorContent(editor) {
        if (!editor) return;

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);

        await ensureFocus(editor);
        await sleep(TIMING.focus);
        document.execCommand('delete');
        await sleep(TIMING.delete);

        if (editor.textContent.trim() === '') {
            await simulateKey('Backspace');
            await sleep(TIMING.delete);
        }
    }

    // 检查元素是否在表格内
    function isInTable(element) {
        return !!element.closest('.notion-simple-table-block, .notion-table-view, [role="gridcell"], [role="cell"], td, th');
    }

    // 优化的公式转换
    async function convertFormula(editor, formulaObj) {
        try {
            let { formula, type, content, sourceEditors = [] } = formulaObj;

            if (type === 'block-group') {
                if (sourceEditors.length > 1) {
                    const tailEditors = sourceEditors.slice(1).reverse();
                    for (const tailEditor of tailEditors) {
                        await deleteEditorContent(tailEditor);
                    }
                }

                type = 'block';
            }

            // 如果在表格内，强制使用行内公式模式（表格内不支持/block equation）
            if (type === 'block' && isInTable(editor)) {
                console.log('检测到表格内块公式，自动转换为行内模式');
                type = 'inline';
                // 可选：添加 displaystyle 以保持块级显示效果
                // if (!content.trim().startsWith('\\displaystyle')) {
                //    content = '\\displaystyle ' + content;
                // }
            }
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            let node;

            while (node = walker.nextNode()) {
                if (node.textContent.includes(formula)) {
                    textNodes.unshift(node);
                }
            }

            if (!textNodes.length) {
                console.warn('未找到匹配的文本');
                return;
            }

            const targetNode = textNodes[0];
            const startOffset = targetNode.textContent.indexOf(formula);
            const range = document.createRange();
            range.setStart(targetNode, startOffset);
            range.setEnd(targetNode, startOffset + formula.length);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            await ensureFocus(targetNode.parentElement);
            await sleep(TIMING.focus);

            if (type === 'block') {
                // 块公式：删除选中文本，输入 /block equation 命令
                document.execCommand('delete');
                await sleep(TIMING.delete);

                // 重新焦点聚焦，确保光标在正确位置
                await ensureFocus(targetNode.parentElement);
                await sleep(TIMING.refocus);

                // 输入 /block equation 命令（逐字符输入以稳定触发 Notion 斜杠菜单）
                await simulateTyping('/block equation', false);
                await sleep(TIMING.commandMenu);

                // 优先按 Enter 选择命令
                await simulateKey('Enter');
                await sleep(TIMING.commandConfirm);

                // 清空并输入公式内容（去掉 $$ 符号）
                await simulateTyping(content, true);
                await sleep(TIMING.contentInsert);

                // 按 Enter 完成编辑（而非 Escape），避免行序错乱
                await simulateKey('Enter');
                await sleep(TIMING.blockCommit);

                // 再次焦点回到原编辑区域，稳定行顺序
                await ensureFocus(targetNode.parentElement);
                await sleep(TIMING.refocus);
                convertedBlockCount++;
            } else {
                // 行内公式：使用快捷键
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                await ensureFocus(targetNode.parentElement);
                await simulateShortcut(isMac ? 'Meta+Shift+E' : 'Ctrl+Shift+E');
                await sleep(TIMING.inlinePanel);

                // 清空并输入公式内容（去掉 $ 符号）
                document.execCommand('selectAll');
                await sleep(TIMING.selectAll);
                await simulateTyping(content, true);
                await sleep(TIMING.inlineCommit);

                // 按 Enter 确认
                await simulateKey('Enter');
                await sleep(TIMING.inlineCommit);
            }

            return true;
        } catch (error) {
            console.error('转换公式时出错:', error);
            updateStatus(`错误: ${error.message}`);
            throw error;
        }
    }

    // 检测并修复失败的块公式转换
    async function retryFailedBlockEquations() {
        try {
            updateStatus('扫描未成功转换的公式...');

            const editors = document.querySelectorAll('[contenteditable="true"]');
            let retryCount = 0;

            for (const editor of editors) {
                if (shouldStop) break;
                const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
                const textNodes = [];
                let node;

                // 收集所有文本节点
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }

                // 查找 /block equation
                for (let i = 0; i < textNodes.length; i++) {
                    if (shouldStop) break;
                    const node = textNodes[i];
                    if (node.textContent.includes('/block equation')) {
                        console.log('找到失败的块公式标记');

                        // 删除 /block equation 文本
                        const startOffset = node.textContent.indexOf('/block equation');
                        const range = document.createRange();
                        range.setStart(node, startOffset);
                        range.setEnd(node, startOffset + '/block equation'.length);

                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);

                        await ensureFocus(node.parentElement);
                        await sleep(TIMING.focus);
                        document.execCommand('delete');
                        await sleep(TIMING.delete);

                        // 查找该行后面的内容（已无 $$ 格式）
                        if (i + 1 < textNodes.length) {
                            const nextNode = textNodes[i + 1];
                            const content = nextNode.textContent.trim();

                            if (content && content.length > 0) {
                                console.log('重新转换失败的块公式，内容:', content);

                                // 选中下一行全部内容
                                const formulaRange = document.createRange();
                                formulaRange.selectNodeContents(nextNode);

                                selection.removeAllRanges();
                                selection.addRange(formulaRange);

                                await ensureFocus(nextNode.parentElement);
                                await sleep(TIMING.focus);

                                // 删除该行内容
                                document.execCommand('delete');
                                await sleep(TIMING.delete);

                                // 重新输入 /block equation 命令（逐字符输入以稳定触发 Notion 斜杠菜单）
                                await simulateTyping('/block equation', false);
                                await sleep(TIMING.commandMenu);

                                // 优先按 Enter 选择命令
                                await simulateKey('Enter');
                                await sleep(TIMING.commandConfirm);

                                // 输入公式内容
                                await simulateTyping(content, true);
                                await sleep(TIMING.contentInsert);

                                // 按 Escape 完成编辑
                                await simulateKey('Escape');
                                await sleep(TIMING.blockCommit);

                                retryCount++;
                                updateStatus(`重新转换失败公式... (${retryCount})`);
                                await sleep(TIMING.retryStatus);
                            }
                        }
                    }
                }
            }

            if (retryCount > 0) {
                updateStatus(`完成修复 ${retryCount} 个失败公式`, 3000);
                console.log('修复完成，失败公式数:', retryCount);
            } else {
                updateStatus('未找到失败的公式', 2000);
            }

            return retryCount;
        } catch (error) {
            console.error('修复失败公式时出错:', error);
            updateStatus(`修复出错: ${error.message}`, 3000);
            return 0;
        }
    }

    // 优化的主转换函数
    async function convertFormulas() {
        if (isProcessing) return;
        isProcessing = true;
        shouldStop = false;
        convertBtn.classList.add('processing');
        convertBtn.textContent = '取消';

        try {
            formulaCount = 0;
            convertedBlockCount = 0;
            updateStatus('开始扫描文档... (按ESC取消)');

            const editors = document.querySelectorAll('[contenteditable="true"]');
            console.log('找到编辑区域数量:', editors.length);

            const conversionTasks = collectConversionTasks(editors);
            const totalFormulas = conversionTasks.reduce((sum, task) => sum + task.sourceCount, 0);

            if (totalFormulas === 0) {
                updateStatus('未找到需要转换的公式', 3000);
                updateProgress(0, 0);
                convertBtn.classList.remove('processing');
                isProcessing = false;
                return;
            }

            updateStatus(`找到 ${totalFormulas} 个公式，开始转换...`);

            // 从末尾开始处理公式，避免前面的编辑操作影响后面的定位
            for (const task of conversionTasks.reverse()) {
                if (shouldStop) break;
                await convertFormula(task.editor, task);
                formulaCount += task.sourceCount;
                updateProgress(formulaCount, totalFormulas);
                const taskType = task.type === 'block-group'
                    ? `block-group:${task.sourceCount}`
                    : task.type;
                updateStatus(`正在转换... (${formulaCount}/${totalFormulas}) [${taskType}]`);
                // 给Notion更多时间处理块公式
                if (task.type === 'block' || task.type === 'block-group') {
                    await sleep(TIMING.betweenBlocks);
                }
            }

            if (shouldStop) {
                updateStatus(`已取消。已完成: ${formulaCount}`, 3000);
            } else {
                if (convertedBlockCount > 0) {
                    updateStatus(`初始转换完成，开始核对...`);
                    await sleep(TIMING.retryStart);

                    // 只在本轮确实转换过块公式时才做核对，减少整篇扫描耗时
                    await retryFailedBlockEquations();
                }

                updateStatus(`Done:${formulaCount}`, 3000);
            }

            convertBtn.textContent = `🔄 (${formulaCount})`;

            // 转换完成后自动收起面板
            setTimeout(() => {
                if (!panel.classList.contains('collapsed')) {
                    panel.classList.add('collapsed');
                    isCollapsed = true;
                }
            }, 1000);

        } catch (error) {
            console.error('转换过程出错:', error);
            updateStatus(`发生错误: ${error.message}`, 5000);
            updateProgress(0, 0);
        } finally {
            isProcessing = false;
            convertBtn.classList.remove('processing');

            setTimeout(() => {
                if (!isProcessing) {
                    updateProgress(0, 0);
                }
            }, 1000);
        }
    }

    // 点击事件模拟
    async function simulateClick(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const events = [
            new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY })
        ];

        for (const event of events) {
            element.dispatchEvent(event);
            await sleep(TIMING.clickStep);
        }
    }

    // 键盘快捷键模拟
    async function simulateShortcut(keyCombination) {
        const keys = keyCombination.split('+');
        const keyEvents = [];

        // 创建键盘事件
        for (const key of keys) {
            const isModifier = ['ctrl', 'shift', 'alt', 'meta'].includes(key.toLowerCase());
            const keyCode = getKeyCode(key);

            keyEvents.push({
                key: keyCode.key,
                code: keyCode.code,
                keyCode: keyCode.keyCode,
                ctrlKey: keys.includes('Ctrl'),
                shiftKey: keys.includes('Shift'),
                altKey: keys.includes('Alt'),
                metaKey: keys.includes('Meta'),
                bubbles: true
            });
        }

        // 先按下所有修饰键
        for (let i = 0; i < keyEvents.length - 1; i++) {
            const event = keyEvents[i];
            document.dispatchEvent(new KeyboardEvent('keydown', event));
        }

        // 按下最终按键
        const finalEvent = keyEvents[keyEvents.length - 1];
        document.dispatchEvent(new KeyboardEvent('keydown', finalEvent));
        document.dispatchEvent(new KeyboardEvent('keyup', finalEvent));

        // 释放所有修饰键
        for (let i = keyEvents.length - 2; i >= 0; i--) {
            const event = keyEvents[i];
            document.dispatchEvent(new KeyboardEvent('keyup', event));
        }

        await sleep(TIMING.inlinePanel);
    }

    // 获取键盘按键信息
    function getKeyCode(key) {
        const keyMap = {
            'ctrl': { key: 'Control', code: 'ControlLeft', keyCode: 17 },
            'shift': { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
            'alt': { key: 'Alt', code: 'AltLeft', keyCode: 18 },
            'meta': { key: 'Meta', code: 'MetaLeft', keyCode: 91 },
            'enter': { key: 'Enter', code: 'Enter', keyCode: 13 },
            'backspace': { key: 'Backspace', code: 'Backspace', keyCode: 8 },
            'escape': { key: 'Escape', code: 'Escape', keyCode: 27 },
            'e': { key: 'e', code: 'KeyE', keyCode: 69 }
        };

        return keyMap[key.toLowerCase()] || { key: key, code: `Key${key.toUpperCase()}`, keyCode: key.charCodeAt(0) };
    }

    // 初始化
    createPanel();
    convertBtn.addEventListener('click', () => {
        if (isProcessing) {
            shouldStop = true;
            updateStatus('正在取消...');
        } else {
            convertFormulas();
        }
    });

    // 监听ESC键取消
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isProcessing) {
            shouldStop = true;
            updateStatus('正在取消...');
        }
    });

    // 页面加载完成后检查公式数量
    setTimeout(() => {
        const formulas = findFormulas(document.body.textContent);
        if (formulas.length > 0) {
            convertBtn.textContent = `🔄(${formulas.length})`;
        }
    }, 1000);

    console.log('公式转换工具已加载');
})();
