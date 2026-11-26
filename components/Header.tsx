import Link from "next/link";
export function Header(){return <header className="header"><Link className="brand" href="/">交易聚合 <span>V2</span></Link><nav><Link href="/platforms">平台目录</Link><Link href="/academy">知识学院</Link><Link href="/forum">交易者论坛</Link><Link href="/login">登录 / 注册</Link></nav></header>}
