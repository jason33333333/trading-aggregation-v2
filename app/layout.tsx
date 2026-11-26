import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
export const metadata: Metadata = {title:"交易聚合 V2 | 全球交易平台信息与学习社区",description:"全球交易平台档案、交易知识学院与交易者交流社区。"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body><Header/>{children}<footer className="footer">交易聚合 V2 · 独立信息整理与学习社区。平台资料需以监管机构及服务商最新披露为准；本站内容不构成投资建议。</footer></body></html>}
