import { Outlet } from "react-router-dom";
import style from "./Layout.module.scss";

const Layout = () => (
  <div className={style.Layout}>
    <div className={style.Header}> 
      <h1>Hoomes<span>.</span> </h1>
    </div>
    <div className={style.Body}>
      <Outlet/>
    </div>
  </div>
);

export { Layout }