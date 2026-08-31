import React from "react";
import { FaFacebookF, FaInstagram, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import '../../estilos/layout/FooterDashboard.css'

function FooterDashboard() {
  // Arrays con las rutas de las imágenes de sponsors
  const sponsorsPrincipales = [
    "/assets/sponsor/1.png",
    "/assets/sponsor/2.png",
    "/assets/sponsor/3.png",
    "/assets/sponsor/4.png",
    "/assets/sponsor/5.png",
  ];

  const sponsorsSecundarios = [
    "/assets/sponsor/6.png",
    "/assets/sponsor/7.png",
    "/assets/sponsor/8.png",
    "/assets/sponsor/9.png",
    "/assets/sponsor/10.png",
  ];

  return (
    <footer className="footer-rally text-center position-relative pt-5 pb-4">
      {/* Contenido del footer */}
      <div className="footer-contenido position-relative">

        {/* FILA 1: Logo + Título */}
        <div className="footer-fila footer-fila-marca d-flex justify-content-center align-items-center gap-4 mb-1">
          <div className="footer-columna footer-logo-columna">
            <img
              src="/assets/logo-rally-uruguayo.png"
              alt="Logo Rally Nacional Uruguayo"
              className="footer-logo-img"
            />
          </div>
          <div className="footer-columna footer-titulo-columna">
            <h2 className="text-white fw-bold mb-2 font-argentino" style={{ letterSpacing: "2px" }}>
              Rally Nacional Uruguayo
            </h2>
            <div className="footer-linea-decorativa"></div>
          </div>
        </div>

        {/* FILA 2: Íconos de redes sociales */}
        <div className="footer-fila footer-fila-redes d-flex justify-content-center gap-3 mb-3">
          <a href="https://www.instagram.com/cluburuguayoderally" className="social-icon" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="https://www.facebook.com/cluburuguayoderally/?locale=es_LA" className="social-icon" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="https://www.cur.com.uy/" className="social-icon" aria-label="Sitio web oficial">
            <FaGlobe />
          </a>
          <a href="https://x.com/uruguayoderally" className="social-icon" aria-label="Twitter">
            <FaXTwitter />
          </a>
        </div>

        {/* FILA 3: Sponsors */}
        <div className="footer-fila footer-fila-sponsors">
          {/* SPONSORS PRINCIPALES */}
          <div className="mb-2">
            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap mb-2">
              {sponsorsPrincipales.map((rutaImagen, indice) => (
                <div key={indice} className="sponsor-principal-contenedor">
                  <img
                    src={rutaImagen}
                    alt={`Sponsor principal ${indice + 1}`}
                    className="sponsor-principal-img"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SPONSORS SECUNDARIOS */}
          <div className="mb-3">
            <div className="d-flex justify-content-center align-items-center flex-wrap">
              {sponsorsSecundarios.map((rutaImagen, indice) => (
                <div key={indice} className="sponsor-secundario-contenedor">
                  <img
                    src={rutaImagen}
                    alt={`Sponsor secundario ${indice + 1}`}
                    className="sponsor-secundario-img"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILA 4: Información de desarrollo */}
        <div className="footer-fila footer-fila-info">
          <p className="text-white-50 mb-0" style={{ fontSize: "14px" }}>
            Desarrollado por Martin Sabbatini | Copyright © 2026 | Soporte: +54 9 3513977714
          </p>
        </div>
      </div>
    </footer>
  );
}

export default FooterDashboard;