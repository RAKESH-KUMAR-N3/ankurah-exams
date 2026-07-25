fetch('http://localhost:5000/api/study-materials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    examId: '60d5ecb8b392d7168c4a1234',
    subjectId: '60d5ecb8b392d7168c4a1235',
    chapterId: '60d5ecb8b392d7168c4a1236',
    type: 'PDF',
    title: 'trig.pdf',
    url: '/uploads/test.pdf'
  })
}).then(res => res.text()).then(console.log).catch(console.error);
