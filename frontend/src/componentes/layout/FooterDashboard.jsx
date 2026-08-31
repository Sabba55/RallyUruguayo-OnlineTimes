import React from "react";
import { FaFacebookF, FaInstagram, FaGlobe, FaYoutube } from "react-icons/fa";
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
      {/* Imagen decorativa que sobresale arriba */}
      {/* <img
        src="/assets/recursos-lineas.png"
        alt="Decoración superior"
        className="lineas-decorativas-superior position-absolute"
      /> */}

      {/* Contenido del footer */}
      <div className="footer-contenido position-relative">
        {/* Título Rally Argentino */}
        <h2 className="text-white fw-bold mb-2 font-argentino" style={{ letterSpacing: "2px" }}>
          RALLY ARGENTINO
        </h2>

        <div
          style={{
            width: "350px",
            height: "5px",
            background: "linear-gradient(135deg, #0170c4 0%, #018BEB 80%)",
            margin: "0 auto 15px auto",
            borderRadius: "5px",
          }}
        ></div>

        {/* Íconos de redes sociales */}
        <div className="d-flex justify-content-center gap-3 mb-3">
          <a href="https://www.facebook.com/RallyArgentino" className="social-icon" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="https://x.com/RallyArgentino" className="social-icon" aria-label="Twitter">
            <FaXTwitter />
          </a>
          <a href="https://www.instagram.com/rallyargentino/" className="social-icon" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="https://www.rallyargentino.com/" className="social-icon" aria-label="Sitio web oficial">
            <FaGlobe />
          </a>
          <a href="https://www.youtube.com/@RallyArgentinoOficial/featured" className="social-icon" aria-label="YouTube">
            <FaYoutube />
          </a>
        </div>

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

        {/* Información de desarrollo en una sola línea */}
        <p className="text-white-50 mb-0" style={{ fontSize: "14px" }}>
          Desarrollado por Martin Sabbatini | Copyright © 2025 | Soporte: +54 9 3513977714
        </p>
      </div>
    </footer>
  );
}

export default FooterDashboard;