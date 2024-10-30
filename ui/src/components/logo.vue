<template lang="html">
  <!-- Created with Inkscape (http://www.inkscape.org/)
  Source svg is in ../assets/logo.svg
 -->
  <svg
    id="svg1"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
    sodipodi:docname="logo.svg"
    viewBox="0 0 60 60"
    sodipodi:version="0.32"
    version="1.0"
    y="0"
    x="0"
    inkscape:version="0.92.2 (5c3e80d, 2017-08-06)"
  >
    <defs
      id="defs10"
    >
      <filter
        id="filter4918"
        style="color-interpolation-filters:sRGB;"
        inkscape:label="Drop Shadow"
      >
        <feFlood
          id="feFlood4908"
          flood-opacity="0.5"
          flood-color="rgb(0,0,0)"
          result="flood"
        />
        <feComposite
          id="feComposite4910"
          in="flood"
          in2="SourceGraphic"
          operator="in"
          result="composite1"
        />
        <feGaussianBlur
          id="feGaussianBlur4912"
          in="composite1"
          stdDeviation="1"
          result="blur"
        />
        <feOffset
          id="feOffset4914"
          dx="1"
          dy="1"
          result="offset"
        />
        <feComposite
          id="feComposite4916"
          in="SourceGraphic"
          in2="offset"
          operator="over"
          result="composite2"
        />
      </filter>
    </defs>
    <g
      id="g844"
    >
      <path
        id="path849-0"
        :style="`fill:${$vuetify.theme.current.colors.secondary};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:6.73885536;stroke-linecap:round;stroke-linejoin:round;filter:url(#filter4918)`"
        d="M 42.6875,35.970703 A 19.059981,19.059981 0 0 1 29.966797,40.8125 19.059981,19.059981 0 0 1 17.742188,36.322266 28.071067,28.071067 0 0 0 7.4277344,45.390625 30.902608,30.188471 0 0 0 29.763672,54.732422 30.902608,30.188471 0 0 0 53.001953,44.408203 28.071067,28.071067 0 0 0 42.6875,35.970703 Z"
        inkscape:connector-curvature="0"
      />
      <circle
        id="path849-6"
        :style="`fill:${$vuetify.theme.current.colors.primary};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:2.95910001;stroke-linecap:round;stroke-linejoin:round;filter:url(#filter4918)`"
        transform="matrix(1.213572,0.00387111,-0.00387111,1.213572,6.217673,-5.9946115)"
        sodipodi:stroke-cmyk="(0 0 0 0.8)"
        cx="19.524126"
        cy="22.301342"
        r="12.326291"
      />
    </g>
  </svg>
</template>

<script lang="ts" setup>
</script>

<style lang="css">
</style>
