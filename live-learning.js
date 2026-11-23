/* Shared live-study enhancements for English and Tagalog GTKJ. */
(function () {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function isTagalog() {
    return String(document.documentElement.lang || '').toLowerCase().indexOf('tl') === 0;
  }
  function strings(tl) {
    return tl ? {
      points:'MGA PUNTONG DAPAT MAALALA', pointsTitle:'Ano ang matututuhan mo',
      principle:'Pangunahing prinsipyo', analogy:'Isang paghahalintulad',
      transformation:'NAGBABAGO TAYO SA PAMAMAGITAN NG EBANGHELYO',
      transformationTitle:'Nagiging higit na katulad ni Jesus',
      reveal:'Ano ang ipinakikita nito tungkol sa Diyos',
      follow:'Tularan ang halimbawang ito sa Biblia',
      avoid:'Matuto mula sa babalang ito',
      response:'Isang tugon sa aking buhay',
      quiz:'SURIIN ANG IYONG PAG-UNAWA', quizTitle:'Mga tanong para pag-isipan',
      quizIntro:'Sinasaklaw ng mga tanong ang mga pagbasa at kung paano isasabuhay ang aralin. Maaari mong subukan muli; walang parusa sa maling sagot.',
      check:'Suriin ang aking mga sagot →', all:'Pakisagutan muna ang mga tanong.',
      retry:'Suriing muli ang mahahalagang punto, baguhin ang mga sagot at subukan muli. Walang parusa.',
      success:'✓ Tama ang lahat ng sagot. Naunawaan mo ang mga pangunahing punto.',
      more:'Natututuhan natin ang pagbabago ng pagkatao sa pagtitiwala kay Jesus at sa tulong ng Espiritu Santo.',
      q5:'Aling tugon ang pinakamainam na nagsasabuhay ng katotohanang ito?',
      wrong:['Gamitin ang aralin upang laitin ang iba.','Umasa lamang sa sariling lakas at huwag humingi ng tulong kay Jesus.','Balewalain ang natutuhan kapag mahirap itong isagawa.'],
      lead:'Basahin at pag-isipan ang talata, saka piliin ang sagot na pinakamainam na nagpapaliwanag dito.', readRef:'Basahin:',
      after:'Pagkatapos mong pag-aralan ang mga pagbasa, sagutan ang maikling pagsusuri bago tapusin ang aralin.'
    } : {
      points:'TRUTHS TO REMEMBER', pointsTitle:'What you will discover',
      principle:'The principle to understand', analogy:'A helpful comparison',
      transformation:'THE GOSPEL CHANGES US',
      transformationTitle:'Becoming More Like Jesus',
      reveal:'What this reveals about God',
      follow:'Follow this biblical example',
      avoid:'Learn from this warning',
      response:'A response in my life',
      quiz:'CHECK YOUR UNDERSTANDING', quizTitle:'Questions to consider',
      quizIntro:'These questions cover the readings and how to live out the lesson. You can try again; there is no penalty for a wrong answer.',
      check:'Check my answers →', all:'Please answer all questions first.',
      retry:'Review the key ideas, change your answers and try again. There is no penalty.',
      success:'✓ All answers correct. You have understood the key ideas.',
      more:'Character transformation grows through trust in Jesus and the help of the Holy Spirit.',
      q5:'Which response best puts this truth into practice?',
      wrong:['Use the lesson to shame someone else.','Rely only on your own effort and refuse Christ’s help.','Ignore the truth when it is difficult to follow.'],
      lead:'Read and consider the passage, then choose the answer that best explains it.', readRef:'Read:',
      after:'After studying the readings, complete this short check before finishing the study.'
    };
  }
  function pointsFor(study, tl, s) {
    if (tl && window.GTKJ_TL_CONTENT && window.GTKJ_TL_CONTENT.outcomes && window.GTKJ_TL_CONTENT.outcomes[study]) {
      return window.GTKJ_TL_CONTENT.outcomes[study].map(function (p) { return [p[0], p[1]]; });
    }
    if (!tl) {
      var p2 = window.GTKJ_REVIEW_PASS2 && window.GTKJ_REVIEW_PASS2.studies[study];
      if (p2 && Array.isArray(p2.points)) return p2.points.map(function (p) { return [p.text, p.ref]; });
    }
    var ideas = (s && Array.isArray(s.ideas)) ? s.ideas.slice(0, 3).map(function (p) { return [p[1], p[2]]; }) : [];
    var principle = (typeof DEPTH !== 'undefined' && DEPTH[study]) ? DEPTH[study].principle : (s ? s.intro : '');
    var ref = (typeof DEPTH !== 'undefined' && DEPTH[study] && DEPTH[study].steps[0]) ? DEPTH[study].steps[0][0] : '';
    ideas.push([principle, ref]);
    return ideas;
  }
  function quizRows(id) {
    var review=isTagalog()?window.GTKJ_TL_CONTENT:window.GTKJ_REVIEW;
    return review && review.quizzes && review.quizzes[id];
  }
  window.GTKJ_HAS_NO_QUIZ = function(id) {
    var rows=quizRows(id);
    return Array.isArray(rows) && rows.length===0;
  };
  function render(study, index) {
    var tl = isTagalog(), text = strings(tl);
    var s = (typeof STUDIES !== 'undefined') ? STUDIES.find(function (item) { return item.id === study.id; }) : null;
    var points = pointsFor(study.id, tl, s);
    var analogy = tl ? (window.GTKJ_TL_CONTENT && window.GTKJ_TL_CONTENT.analogy[study.id]) : (window.GTKJ_REVIEW && window.GTKJ_REVIEW.analogy[study.id]);
    var t = tl ? (window.GTKJ_TL_CONTENT && window.GTKJ_TL_CONTENT.studies[study.id]) : (window.GTKJ_REVIEW_PASS3 && window.GTKJ_REVIEW_PASS3.studies[study.id]);
    var html = '<section class="panel learning-outcomes"><div class="panel-header"><span class="small-round">✦</span><h2>'+text.pointsTitle+'</h2></div><p class="reading-guidance">'+text.points+'</p><ol>';
    points.forEach(function (p) { html += '<li><p>'+esc(p[0])+'</p><div class="scripture">'+text.readRef+' '+esc(p[1] || '')+'</div></li>'; });
    html += '</ol></section>';
    if (!points.length) html='';
    if (analogy) html += '<section class="panel learning-analogy"><div class="panel-header"><span class="small-round">≈</span><h2>'+text.analogy+'</h2></div><p>'+esc(analogy)+'</p></section>';
    if (t) {
      var cards = [[text.reveal,t.reveal],[text.follow,t.follow],[text.avoid,t.avoid],[text.response,t.response]];
      html += '<section class="panel learning-change"><div class="panel-header"><span class="small-round">✦</span><h2>'+text.transformationTitle+'</h2></div><p class="reading-guidance">'+text.transformation+'</p><div class="learning-change-grid">';
      cards.forEach(function (card) { html += '<article><h3>'+card[0]+'</h3><p>'+esc(card[1])+'</p></article>'; });
      html += '</div></section>';
    }
    var questions = quizRows(study.id);
    if (!Array.isArray(questions)) {
      return html + '<section class="panel learning-quiz" role="status"><h2>'+text.quizTitle+'</h2><p>'+
        (tl ? 'Hindi maikarga ang mga tanong. I-refresh ang pahina upang subukang muli.' :
              'The review questions could not be loaded. Refresh this page to try again.')+'</p></section>';
    }
    if (!questions.length) return html;
    html += '<section class="panel learning-quiz"><div class="panel-header"><span class="small-round">05</span><h2>'+text.quizTitle+'</h2></div><p class="reading-guidance">'+text.quizIntro+' '+text.after+'</p><form class="gtk-study-quiz" data-quiz-id="'+esc(study.id)+'"><div class="eyebrow">'+text.quiz+'</div>';
    questions.forEach(function (item, i) {
      var choices = [{value:item[1],correct:true}].concat(item.slice(2).map(function (value) { return {value:value,correct:false}; }));
      var shift = (i * 3 + study.id.length) % choices.length;
      choices = choices.slice(shift).concat(choices.slice(0, shift));
      html += '<fieldset class="gtk-quiz-item"><legend>'+(i+1)+'. '+esc(item[0])+'</legend>';
      choices.forEach(function (choice, j) {
        html += '<label class="gtk-quiz-choice"><input type="radio" name="q'+i+'" value="'+(choice.correct?'1':'0')+'"><span>'+esc(choice.value)+'</span></label>';
      });
      html += '</fieldset>';
    });
    html += '<button class="btn btn-dark" type="submit">'+text.check+'</button><div class="gtk-quiz-result" role="status" aria-live="polite" data-quiz-result></div></form></section>';
    return html;
  }
  window.GTKJ_RENDER_COURSE_ADDONS = render;
  window.GTKJ_COURSE_ADDON_STRINGS = strings;
})();