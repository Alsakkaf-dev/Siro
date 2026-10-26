import React, { useState } from 'react';

const ICONS = {
  dir: '📁', dirOpen: '📂', pdf: '📕', md: '📝', txt: '📄', pptx: '🎞️', ppt: '🎞️',
  xlsx: '📊', xls: '📊', csv: '📊', docx: '📘', html: '🌐', png: '🖼️', jpg: '🖼️',
  jpeg: '🖼️', gif: '🖼️', json: '🧩',
};

function Node({ node, depth, onOpen, selectedPath, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? depth < 1);

  if (node.type === 'dir') {
    return (
      <div className="tree-node">
        <div className="tree-row" onClick={() => setOpen(!open)}>
          <span className="ico">{open ? ICONS.dirOpen : ICONS.dir}</span>
          <span className="nm">{node.name}</span>
          <span className="badge">{node.children?.length ?? 0}</span>
        </div>
        {open && (
          <div className="tree-children">
            {node.children?.map((c) => (
              <Node key={c.relPath} node={c} depth={depth + 1} onOpen={onOpen} selectedPath={selectedPath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isPpt = node.ext === 'pptx' || node.ext === 'ppt';
  return (
    <div
      className={`tree-row ${selectedPath === node.relPath ? 'selected' : ''}`}
      onClick={() => onOpen(node)}
      title={node.relPath}
    >
      <span className="ico">{ICONS[node.ext] ?? '📄'}</span>
      <span className="nm">{node.name}</span>
      {isPpt && <span className={`badge ${node.convertedAvailable ? 'pdf-ok' : ''}`}>{node.convertedAvailable ? 'PDF ✓' : 'RAW'}</span>}
    </div>
  );
}

export default function FileTree({ tree, onOpen, selectedPath, filterRoot = null }) {
  if (!tree) return <div className="muted">⏳ Loading tree…</div>;
  let children = tree.children ?? [];
  if (filterRoot) {
    const rootNode = children.find((c) => c.name === filterRoot);
    children = rootNode ? [rootNode] : children;
  }
  return (
    <div>
      {children.map((c) => (
        <Node key={c.relPath} node={c} depth={0} onOpen={onOpen} selectedPath={selectedPath} defaultOpen={!!filterRoot} />
      ))}
    </div>
  );
}
