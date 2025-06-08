particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ff3333' },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: false },
        move: { enable: true, speed: 2, direction: 'none', random: true, straight: false }
    },
    interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
        modes: { repulse: { distance: 100, duration: 0.4 } }
    }
});

function addText(text) {
    const content = document.getElementById('terminalContent');
    const p = document.createElement('p');
    p.textContent = text;
    p.style.animation = 'slideIn 0.6s ease-out, fadeIn 0.8s ease-in';
    p.style.fontWeight = 'bold';
    content.appendChild(p);
    content.scrollTop = content.scrollHeight;
}

function optimizeDevice() {
    const status = document.getElementById('status');
    status.textContent = 'Optimizing...';
    addText('> Running optimization script...');
    setTimeout(() => {
        addText('> Memory cleared: 2.5 GB');
        addText('> Cache optimized: 100%');
        addText('> System performance increased by 15%');
        status.textContent = 'Optimization Complete!';
    }, 2000);
}

window.onload = () => {
    addText('> Initializing system...');
    setTimeout(() => {
        addText('> Loading modules...');
        setTimeout(() => {
            addText('> System ready!');
        }, 1200);
    }, 1200);
};