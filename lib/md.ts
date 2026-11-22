import { marked } from "marked";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
marked.use({ renderer: { html: ({ text }) => esc(text) } });

export const renderMd = (md: string) => marked.parse(md, { async: false }) as string;
