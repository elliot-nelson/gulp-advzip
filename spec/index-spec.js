const fs = require('fs');
const Vinyl = require('vinyl');
const advzip = require('../index');
const EventEmitter = require('events');
const childProcess = require('child_process');
const streamBuffers = require('stream-buffers');

describe('advzip', function () {
    beforeEach(function () {
        this.fakeProcess = new EventEmitter();
        this.fakeProcess.stdout = new streamBuffers.WritableStreamBuffer();
        spyOn(childProcess, 'spawn').and.callFake((command, args) => {
            process.nextTick(() => {
                fs.writeFileSync(args[args.length - 1], 'crunched zip file', 'utf8');
                this.fakeProcess.emit('close', 0);
            });
            return this.fakeProcess;
        });
    });

    it('replaces zip files contents with the buffer returned by the executable', function (done) {
        this.files = [
            new Vinyl({
                cwd: 'cwd',
                base: 'base',
                path: 'base/archive.zip',
                contents: new Buffer('a zip file'),
                stat: {}
            })
        ];

        let output = [];
        let stream = advzip();
        stream.on('data', file => {
            output.push(file);
        });
        stream.on('end', () => {
            expect(output.length).toEqual(1);
            expect(output[0].contents.toString('utf8')).toEqual('crunched zip file');
            done();
        });

        stream.write(this.files[0]);
        stream.resume();
        stream.end();
    });
});
