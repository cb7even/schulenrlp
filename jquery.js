'use strict'
//Warten bis Dokument komplett geladen ist
$(document).ready(function () {
  appStart();
  $("#sidebar_L").css('display', 'none');
  /*Seite wird neu geladen*/
  $(document).on("load", function () {
    appStart();
    $("#sidebar_L").css('display', 'none');
  });

  /* Handling der Buttons */
  //Sidebar zeigen oder verbergen
  $("#btn_open_side").click(function () {
    if ($("#btn_open_side").val() == "open") {
      $("#sidebar_L").css('display', 'block');
      $("#sidebar_L").css('width', '30%');
      $("#main").css('marginLeft', '30%');
      $("#main").css('width', '70%');
      $("#btn_open_side").val("close");
      mymap.setView([49.955139, 8], 8);
    } else {
      $("#sidebar_L").css('display', 'none');
      $("#main").css('marginLeft', '0%');
      $("#main").css('width', '100%');
      $("#btn_open_side").val("open");
      mymap.setView([49.955139, 7.310417], 8);
    }
  });
  //Anwendungsbereiche auswählen
  $("#btn_auswahl").click(function () {
    var x = document.getElementById("anwendungsauswahl");
    //Auswahlmenü zeigen oder verbergen
    if (x.className.indexOf("w3-show") == -1) {
      x.className += " w3-show";
    } else {
      x.className = x.className.replace(" w3-show", "");
    }
  });

  $("#btn_auswahl_r").click(function () {
    $("#btn_auswahl").text("Routenplanung Schulweg");
    $("#route").css('display', 'block');
    $("#umkreis").css('display', 'none');
    $("#selektion").css('display', 'none');
    $("#ausgabe").css('display', 'none');
    var x = document.getElementById("anwendungsauswahl");
    x.className = x.className.replace(" w3-show", "");
    legend.addTo(mymap);
  });

  $("#btn_auswahl_u").click(function () {
    $("#btn_auswahl").text("Schulen im Umkreis");
    $("#route").css('display', 'none');
    $("#umkreis").css('display', 'block');
    $("#selektion").css('display', 'none');
    $("#ausgabe").css('display', 'none');
    var x = document.getElementById("anwendungsauswahl");
    x.className = x.className.replace(" w3-show", "");
    legend.remove();
  });

  $("#btn_auswahl_s").click(function () {
    $("#btn_auswahl").text("Schulsuche");
    $("#route").css('display', 'none');
    $("#umkreis").css('display', 'none');
    $("#selektion").css('display', 'block');
    $("#ausgabe").css('display', 'none');
    var x = document.getElementById("anwendungsauswahl");
    x.className = x.className.replace(" w3-show", "");
    legend.remove();
  });

  //Abschicken Routenplanung
  $("#btn_suche_route").click(function () {
    $("#ausgabetabelle tr").remove();
    $("#kategorientabelle tr").remove();
    $("#falsche_E_route").text("");
    $("#falsche_E").text("");
    $("#falsche_E_schule").text("");
    searchAddress();
    $("#btn_moreinfo").text("mehr Informationen \u279A ");
    $("#ausgabe").css('display', 'block');
    $("#divausgabetabelle").css('display', 'block');
    $("#divausgabeliste").css('display', 'none')
    $("#btn_moreinfo").css('display', 'block');
  });

  //Abschicken Umkreisabfrage
  $("#btn_suche_umkr").click(function () {
    $("#ausgabe_list").empty();
    $("#keine_art_umkr").text("");
    $("#falsche_E_umkr").text("");
    $("#falsche_E_abstand").text("");
    $("#divausgabetabelle").css('display', 'none');
    $("#btn_moreinfo").css('display', 'none');
    searchAddress();
    $("#ausgabe").css('display', 'block');
    $("#divausgabeliste").css('display', 'block')
    window.location.hash = "ausgabe";
  });

  //Abschicken der Schulsuche
  $("#btn_suche_sel").click(function () {
    $("#ausgabe_list").empty();
    $("#falsche_E_num").text("");
    $("#falsche_E_ort").text("");
    $("#keine_art_sel").text("");
    filterSchools();
    $("#divausgabetabelle").css('display', 'none');
    $("#btn_moreinfo").css('display', 'none');
    $("#ausgabe").css('display', 'block');
    $("#divausgabeliste").css('display', 'block')
    window.location.hash = "ausgabe";
  });




  $("#btn_moreinfo").click(function () {
    $("#divinfo").css('display', 'block');
    window.location.hash = "divinfo";
  });
  $("#btn_info_close").click(function () {
    $("#divinfo").css('display', 'none');
  });

  //Zurücksetzen
  $("#btn_clearall").click(function () {
    $("#address").val("");
    $("#schule").val("");
    $("#lern1").attr('checked', 'checked');
    $("#lern5").removeAttr('checked');
    $("#lernstufe").css('display', 'none');

    var value = $(this).val().toLowerCase();
    $("#list_schulen li").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });

  });

  //Filtern der Schulliste durch Eingabe
  $("#schule").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#list_schulen li").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
  });

  //Enter-Taste klickt Buttons
  $('#address').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_route').click();
      return false;
    }
  });
  $('#schule').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_route').click();
      return false;
    }
  });
  $('#address_umkr').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_umkr').click();
      return false;
    }
  });
  $('#abstand_umkr').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_umkr').click();
      return false;
    }
  });
  $('#ort').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_sel').click();
      return false;
    }
  });
  $('#num').keypress(function (e) {
    if (e.which == 13) {
      $('#btn_suche_sel').click();
      return false;
    }
  });

});