import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import FileTree from './FileTree.jsx';
import PdfReader from '../reader/PdfReader.jsx';
import MarkdownReader from '../reader/MarkdownReader.jsx';

function subjectOf(relPath) {
  const seg = relPath.split('/')[0];
  return ['NC', 'Cross', 'SDA', 'PSDA', 'BI'].includes(seg) ? seg : 'General';
}

function Viewer({ file }) {
  if (!file) {
    return (
      <div className="viewer-empty">
        <div>
          <div className="big">🧭</div>
          <h3>Your Library</h3>
          <p>Every slide, past paper, drill and mastery doc — pick a file to read it here.<br />
            Reading time is tracked to the subject automatically.</p>
        </div>
      </div>
    );
  }
  const subjectId = subjectOf(file.relPath);
  const ext = file.ext;

  if (ext === 'pdf' || ((ext === 'pptx' || ext === 'ppt') && file.convertedAvailable)) {
    return <PdfReader key={file.relPath} subjectId={subjectId} relPath={file.relPath} />;
  }
  if (ext === 'md' || ext === 'txt') {
    return <MarkdownReader key={file.relPath} subjectId={subjectId} relPath={file.relPath} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return (
      <div className="reader-canvas" style={{ flex: 1 }}>
        <img src={api.fileUrl(file.relPath)} alt={file.name} style={{ maxWidth: '100%', borderRadius: 12 }} />
      </div>
    );
  }
  if (ext === 'html') {
    return <iframe title={file.name} src={api.fileUrl(file.relPath)} style={{ flex: 1, border: 'none', background: '#fff' }} />;
  }
  return (
    <div className="viewer-empty">
      <div>
        <div className="big">📦</div>
        <p><strong>{file.name}</strong> can’t be previewed in-browser ({ext}).</p>
        <a className="candy-btn blue" href={api.fileUrl(file.relPath)} download={file.name}>⬇️ Download</a>
      </div>
    </div>
  );
}

/** Depth-first search for a file node by its relPath. */
function findNode(children, relPath) {
  for (const n of children ?? []) {
    if (n.type === 'file' && n.relPath === relPath) return n;
    if (n.type === 'dir') {
      const hit = findNode(n.children, relPath);
      if (hit) return hit;
    }
  }
  return null;
}

export default function ResourceBrowser() {
  const [tree, setTree] = useState(null);
  const [file, setFile] = useState(null);
  const [params] = useSearchParams();
  const filterRoot = params.get('subject');
  const openPath = params.get('file');

  useEffect(() => {
    api.tree().then(setTree).catch(console.error);
  }, []);

  // Deep-link: /browse?file=<relPath> opens that file immediately (reference cards etc.)
  useEffect(() => {
    if (tree && openPath) {
      const node = findNode(tree.children, openPath);
      if (node) setFile(node);
    }
  }, [tree, openPath]);

  return (
    <div className="browser-layout">
      <aside className="file-tree-panel">
        <FileTree tree={tree} onOpen={setFile} selectedPath={file?.relPath} filterRoot={filterRoot} />
      </aside>
      <section className="viewer-panel">
        <Viewer file={file} />
      </section>
    </div>
  );
}
